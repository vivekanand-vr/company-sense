"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Job } from "@/types/company";
import { listJobs } from "@/lib/companies-api";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { JobErrorBoundary } from "@/components/jobs/JobErrorBoundary";
import { JobLoading } from "@/components/jobs/JobLoading";
import { ArrowLeft, Eye, Clock, CheckCircle, XCircle, Users, Briefcase, Wifi, WifiOff } from "lucide-react";

export default function JobsListPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statistics, setStatistics] = useState<{
    total: number;
    running: number;
    completed: number;
    failed: number;
    pending: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket for real-time job updates
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
                     process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') ||
                     'ws://localhost:8000';

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to all job updates
      newSocket.emit('subscribe-all-jobs');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('job-list-update', (data: { jobs: Job[]; statistics: any }) => {
      setJobs(data.jobs);
      setStatistics(data.statistics);
    });

    newSocket.on('job-update', (data: { jobId: string; job: Job }) => {
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === data.jobId ? { ...job, ...data.job } : job
        )
      );
    });

    setSocket(newSocket);

    // Initial fetch
    fetchJobs();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await listJobs();
      
      if (response.success) {
        setJobs(response.data.jobs);
        setStatistics(response.data.statistics);
        setError(null);
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  if (isLoading) {
    return (
      <JobErrorBoundary>
        <JobLoading message="Loading jobs..." />
      </JobErrorBoundary>
    );
  }

  if (error) {
    return (
      <JobErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Error Loading Jobs</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={fetchJobs} className="mr-3">
              Retry
            </Button>
            <Button variant="outline" onClick={() => router.push('/companies')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </div>
        </div>
      </JobErrorBoundary>
    );
  }

  return (
    <JobErrorBoundary>
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/companies')} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Companies
              </Button>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Bulk Lookup Jobs</h1>
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
                    {isConnected ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-300 font-medium">Live</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-300 font-medium">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-gray-400">Monitor all your company lookup jobs with real-time updates</p>
              </div>
            </div>
            
            <Button onClick={fetchJobs} className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Refresh
            </Button>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{statistics.total}</div>
                <div className="text-sm text-gray-400">Total Jobs</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{statistics.running}</div>
                <div className="text-sm text-blue-300">Running</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{statistics.pending}</div>
                <div className="text-sm text-yellow-300">Pending</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{statistics.completed}</div>
                <div className="text-sm text-green-300">Completed</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{statistics.failed}</div>
                <div className="text-sm text-red-300">Failed</div>
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
            </div>
            
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No jobs found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Bulk lookup jobs will appear here once you create them
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {jobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(job.status)}
                          <h3 className="font-semibold text-white">
                            Bulk Company Lookup
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{job.progress.total} companies</span>
                          </div>
                          <div>
                            Progress: {job.progress.completed}/{job.progress.total}
                          </div>
                          <div>
                            Created: {formatDate(job.createdAt)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: job.progress.total > 0 
                                ? `${(job.progress.completed / job.progress.total) * 100}%` 
                                : '0%' 
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Job ID: {job.id.split('-')[0]}...</span>
                          {job.status === 'running' && job.progress.current && (
                            <span className="text-gray-400">Currently: {job.progress.current}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <Button
                          size="sm"
                          onClick={() => handleViewJob(job.id)}
                          className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </JobErrorBoundary>
  );
}