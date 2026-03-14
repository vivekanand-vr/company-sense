"use client";

import React from "react";
import { Job, JobProgress } from "@/types/company";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { WebSocketStatus } from "./WebSocketStatus";

interface JobProgressIndicatorProps {
  job: Job;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  isConnected?: boolean;
  onReconnect?: () => void;
  usingFallback?: boolean;
  className?: string;
}

export function JobProgressIndicator({ 
  job, 
  connectionStatus = 'disconnected', 
  isConnected = false, 
  onReconnect = () => {}, 
  usingFallback = false,
  className = "" 
}: JobProgressIndicatorProps) {
  const { status, progress } = job;
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'running':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
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

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-white">Bulk Company Lookup</h3>
              <WebSocketStatus 
                connectionStatus={connectionStatus}
                isConnected={isConnected}
                onReconnect={onReconnect}
                usingFallback={usingFallback}
              />
            </div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
        </div>
        {status === 'running' && progress.current && (
          <div className="text-right">
            <p className="text-sm text-gray-400">Currently processing</p>
            <p className="font-medium text-white truncate max-w-xs" title={progress.current}>
              {progress.current}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Progress</span>
          <span className="text-sm text-gray-400">
            {progress.completed} / {progress.total} companies
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-3"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{progressPercentage.toFixed(1)}%</span>
          <span>
            {status === 'running' 
              ? `${progress.total - progress.completed} remaining`
              : status === 'completed' 
                ? 'All done!' 
                : ''
            }
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{progress.successful}</div>
          <div className="text-xs text-green-300 font-medium">Successful</div>
        </div>
        <div className="text-center p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{progress.failed}</div>
          <div className="text-xs text-red-300 font-medium">Failed</div>
        </div>
        <div className="text-center p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{progress.total}</div>
          <div className="text-xs text-blue-300 font-medium">Total</div>
        </div>
      </div>

      {/* Job Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Job ID: {job.id.split('-')[0]}...</span>
          <span>
            Started: {job.startedAt 
              ? new Date(job.startedAt).toLocaleTimeString() 
              : 'Not started'
            }
          </span>
        </div>
        {job.completedAt && (
          <div className="text-sm text-gray-400 mt-1">
            Completed: {new Date(job.completedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}