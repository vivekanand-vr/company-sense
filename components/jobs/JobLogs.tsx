"use client";

import React, { useEffect, useRef } from "react";
import { JobMessage } from "@/types/company";
import { CheckCircle, Info, AlertTriangle, XCircle, Building2 } from "lucide-react";

interface JobLogsProps {
  messages: JobMessage[];
  className?: string;
  autoScroll?: boolean;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export function JobLogs({ messages, className = "", autoScroll = true, connectionStatus = 'disconnected' }: JobLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const getMessageIcon = (level: JobMessage['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const getMessageColor = (level: JobMessage['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-300 border-l-green-400';
      case 'error':
        return 'text-red-300 border-l-red-400';
      case 'warning':
        return 'text-yellow-300 border-l-yellow-400';
      case 'info':
      default:
        return 'text-blue-300 border-l-blue-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (messages.length === 0) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Activity Logs</h3>
        <div className="text-center py-8 text-gray-400">
          <Info className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>No activity logs yet. Logs will appear here as the job progresses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl ${className}`}>
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Activity Logs</h3>
            <p className="text-sm text-gray-400 mt-1">
              Real-time updates from your bulk company lookup job
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-ping' : 
              'bg-red-400'
            }`}></div>
            <span className="text-xs text-gray-400">
              {connectionStatus === 'connected' ? 'WebSocket Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto bg-gray-800/50">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`border-l-4 p-3 rounded-r-lg bg-gray-800/50 ${getMessageColor(message.level)}`}
            >
              <div className="flex items-start space-x-3">
                {getMessageIcon(message.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {message.companyName && (
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-300 truncate max-w-xs" title={message.companyName}>
                            {message.companyName}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm mt-1 font-medium">
                    {message.message}
                  </p>
                  
                  {/* Display metadata if available */}
                  {message.metadata && Object.keys(message.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {Object.entries(message.metadata).map(([key, value]) => (
                        <div key={key} className="inline-block mr-3">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div ref={logsEndRef} />
      </div>
      
      {messages.length > 0 && (
        <div className="p-3 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-400">
            {messages.length} log entr{messages.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
      )}
    </div>
  );
}