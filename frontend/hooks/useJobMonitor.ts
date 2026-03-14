"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Job, JobMessage } from '@/types/company';
import { getJobDetails } from '@/lib/companies-api';

export interface UseJobMonitorResult {
  job: Job | null;
  messages: JobMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  startMonitoring: (jobId: string) => void;
  stopMonitoring: () => void;
  clearJob: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  reconnect: () => void;
  usingFallback: boolean;
}

export function useJobMonitor(): UseJobMonitorResult {
  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<JobMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [usingFallback, setUsingFallback] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const currentJobId = useRef<string | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isInitializing = useRef(false);

  const startFallbackPolling = useCallback(async (jobId: string) => {
    setUsingFallback(false);
    setError('WebSocket connection failed. Please refresh the page.');
    
    // Make only ONE API call to get initial status, then stop
    try {
      const jobResponse = await getJobDetails(jobId);
      if (jobResponse && jobResponse.data?.job) {
        const jobDetails = jobResponse.data.job;
        setJob(jobDetails);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch initial job status:', error);
      setError('Failed to fetch job status');
    }
    
    // Do NOT set up any interval - no continuous polling
  }, []);

  // Initialize WebSocket connection
  const initializeSocket = useCallback(() => {
    // Prevent multiple simultaneous initializations
    if (isInitializing.current) {
      return socketRef.current;
    }
    
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    // Clean up any existing socket first
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    isInitializing.current = true;
    setConnectionStatus('connecting');
    console.log('🔌 Initializing WebSocket connection...');
    
    // Use the WebSocket URL from environment or construct from backend URL
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || 'http://localhost:8000';
    const socketUrl = wsUrl || backendUrl;
    
    console.log('🌐 Connecting to WebSocket URL:', socketUrl);

const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 8000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      path: '/socket.io/', // Default Socket.IO path
      withCredentials: false
    });

    console.log('📡 Socket.IO client created with config:', {
      url: socketUrl,
      transports: ['websocket', 'polling'],
      timeout: 8000
    });

socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server:', socket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      reconnectAttempts.current = 0;
      isInitializing.current = false;
      
      // Clear fallback timeout since we're connected
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      
      // If we were using fallback, stop it since WebSocket is now connected
      if (usingFallback && fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
        setUsingFallback(false);
      }
      
      // Subscribe to current job immediately upon connection
      if (currentJobId.current) {
        console.log('🔔 Subscribing to job after connection:', currentJobId.current);
        socket.emit('subscribe-job', currentJobId.current);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      reconnectAttempts.current = 0;
    });

    socket.on('connect_error', (err) => {
      console.error('🚫 WebSocket connection error:', err);
      setError(`WebSocket connection failed: ${err.message}. Please check if the backend server is running on http://localhost:8000`);
      setConnectionStatus('error');
      setIsConnected(false);
      isInitializing.current = false;
      
      reconnectAttempts.current++;
      
      // DISABLED: No fallback polling to prevent infinite API calls
    });

    socket.on('job-update', (data: { jobId: string; job: Job }) => {
      console.log('📊 Job update received:', data.job.status, data.job.progress);
      if (data.jobId === currentJobId.current) {
        setJob(data.job);
        setError(null); // Clear any subscription errors
        if (data.job.status === 'completed' || data.job.status === 'failed') {
          setIsLoading(false);
        }
      }
    });

    socket.on('job-message', (data: { jobId: string; message: JobMessage }) => {
      console.log('💬 Job message:', data.message.level, data.message.message);
      if (data.jobId === currentJobId.current) {
        setMessages(prev => [...prev, data.message]);
        setError(null); // Clear any subscription errors
      }
    });

    socket.on('job-progress', (data: { jobId: string; progress: Job['progress'] }) => {
      console.log('⏳ Job progress:', `${data.progress.completed}/${data.progress.total}`);
      if (data.jobId === currentJobId.current) {
        setError(null); // Clear any subscription errors
        setJob(prev => prev ? { ...prev, progress: data.progress } : {
          id: data.jobId,
          type: 'bulk_lookup',
          status: 'running',
          progress: data.progress,
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString()
        } as Job);
      }
    });

    socket.on('job-completed', (data: { jobId: string; job: Job }) => {
      console.log('✅ Job completed:', data.job.result?.summary);
      if (data.jobId === currentJobId.current) {
        setJob(data.job);
        setError(null);
        setIsLoading(false);
      }
    });

    socket.on('job-failed', (data: { jobId: string; job: Job }) => {
      console.log('❌ Job failed:', data.job.error);
      if (data.jobId === currentJobId.current) {
        setJob(data.job);
        setError(data.job.error || 'Job failed');
        setIsLoading(false);
      }
    });

    socket.on('job-subscribed', (data: { jobId: string; success: boolean; job?: Job; messages?: JobMessage[] }) => {
      console.log('🔔 Subscribed to job updates:', data.jobId, 'Success:', data.success);
      
      if (data.success && data.jobId === currentJobId.current) {
        if (data.job) {
          setJob(data.job);
        }
        if (data.messages) {
          setMessages(data.messages);
        }
        setError(null);
      } else if (!data.success) {
        console.log('❌ Subscription confirmation failed, but will continue listening for job events');
        // Don't set error - we can still receive job events
      }
    });

    socketRef.current = socket;
    return socket;
  }, [usingFallback, startFallbackPolling]);

  const startMonitoring = useCallback((jobId: string) => {
    console.log('🚀 Starting monitoring for job:', jobId);
    
    currentJobId.current = jobId;
    setMessages([]);
    setError(null);
    setIsLoading(true);
    setJob(null);
    setUsingFallback(false);
    
    // Clear any existing fallback polling
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    
    // Clear any existing fallback timeout
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    
    // Check if socket is already connected
    if (socketRef.current?.connected) {
      console.log('🔔 Socket already connected, subscribing immediately to job:', jobId);
      socketRef.current.emit('subscribe-job', jobId);
      return;
    }
    
    // Initialize socket only if not already connected or connecting
    if (!socketRef.current || socketRef.current.disconnected) {
      initializeSocket();
    }
    
    // DISABLED: Fallback timeout to prevent infinite API calls
    // Only rely on WebSocket connection - no fallback polling
    
  }, [initializeSocket]);

  const stopMonitoring = useCallback(() => {
    if (socketRef.current && currentJobId.current) {
      socketRef.current.emit('unsubscribe-job', currentJobId.current);
    }
    
    // Stop fallback polling
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    
    // Clear fallback timeout
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    
    currentJobId.current = null;
    setIsLoading(false);
    setUsingFallback(false);
  }, []);

  const clearJob = useCallback(() => {
    stopMonitoring();
    setJob(null);
    setMessages([]);
    setError(null);
  }, [stopMonitoring]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    isInitializing.current = false;
    reconnectAttempts.current = 0;
    initializeSocket();
  }, [initializeSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      
      // Clear all timeouts
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      
      // Clean up fallback polling
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      
      // Clean up WebSocket
      if (socketRef.current) {
        if (currentJobId.current) {
          socketRef.current.emit('unsubscribe-job', currentJobId.current);
        }
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      isInitializing.current = false;
    };
  }, []);

  // Auto-reconnection logic for failed connections
  useEffect(() => {
    if (connectionStatus === 'error' && currentJobId.current && reconnectAttempts.current < maxReconnectAttempts && !usingFallback && !isInitializing.current) {
      const timer = setTimeout(() => {
        initializeSocket();
      }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)); // Exponential backoff

      return () => clearTimeout(timer);
    } else if (reconnectAttempts.current >= maxReconnectAttempts && currentJobId.current && !usingFallback) {
      setError('Unable to establish WebSocket connection after multiple attempts');
    }
  }, [connectionStatus, usingFallback, initializeSocket]);

  return {
    job,
    messages,
    isConnected,
    isLoading,
    error,
    startMonitoring,
    stopMonitoring,
    clearJob,
    connectionStatus,
    reconnect,
    usingFallback
  };
}