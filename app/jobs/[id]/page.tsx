"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Job } from "@/types/company";
import { cancelJob, getJobDetails } from "@/lib/companies-api";
import { useJobMonitor } from "@/hooks/useJobMonitor";
import { JobProgressIndicator } from "@/components/jobs/JobProgressIndicator";
import { JobLogs } from "@/components/jobs/JobLogs";
import { JobResults } from "@/components/jobs/JobResults";
import { JobErrorBoundary } from "@/components/jobs/JobErrorBoundary";
import { JobLoading } from "@/components/jobs/JobLoading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react";
// import { toast } from "sonner";

export default function JobStatusPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [isCancelling, setIsCancelling] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Use WebSocket hook for real-time monitoring
  const { 
    job, 
    messages, 
    isConnected, 
    isLoading, 
    error, 
    startMonitoring, 
    stopMonitoring, 
    connectionStatus,
    reconnect,
    usingFallback 
  } = useJobMonitor();

  // Start WebSocket monitoring when component mounts
  useEffect(() => {
    if (jobId) {
      startMonitoring(jobId);
      setInitialLoading(false); // Set initial loading to false since we're using WebSocket
    }

    return () => {
      stopMonitoring();
    };
  }, [jobId, startMonitoring, stopMonitoring]);

  const handleCancelJob = async () => {
    if (!job || job.status !== 'running') return;

    setIsCancelling(true);
    try {
      const response = await cancelJob(jobId);
      if (response.success) {
        // WebSocket will automatically receive the cancellation update
      } else {
        throw new Error(response.message || 'Failed to cancel job');
      }
    } catch (err) {
      console.error('Error cancelling job:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefresh = () => {
    reconnect();
  };

  const handleBackToCompanies = () => {
    router.push('/companies');
  };

  if (isLoading && !job && connectionStatus === 'connecting') {
    return (
      <JobErrorBoundary>
        <JobLoading message="Connecting to real-time job monitoring..." />
      </JobErrorBoundary>
    );
  }

  if (error && !job && !isLoading && connectionStatus !== 'connected') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-900/20 border border-red-800 text-red-300 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-2 text-red-400">Error Loading Job</h3>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={handleRefresh} className="mr-3 bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={handleBackToCompanies} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  if (!job && isLoading) {
    return (
      <JobErrorBoundary>
        <JobLoading message="Loading job details..." />
      </JobErrorBoundary>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Job not found</p>
          <Button onClick={handleBackToCompanies} className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <JobErrorBoundary>
      <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleBackToCompanies}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Job Status</h1>
              <p className="text-gray-400 mt-1">Monitor your bulk company lookup progress</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {job.status === 'running' && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleCancelJob}
                disabled={isCancelling}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isCancelling ? 'Cancelling...' : 'Cancel Job'}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Indicator */}
            <JobProgressIndicator 
              job={job} 
              connectionStatus={connectionStatus}
              isConnected={isConnected}
              onReconnect={reconnect}
              usingFallback={usingFallback}
            />

            {/* Results (only show when completed) */}
            {job.status === 'completed' && job.result && (
              <JobResults result={job.result} />
            )}

            {/* Error State */}
            {job.status === 'failed' && (
              <div className="bg-gray-900 border border-red-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-900/40 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-300">Job Failed</h3>
                    <p className="text-red-400">Your bulk lookup job encountered an error</p>
                  </div>
                </div>
                {job.error && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-300 font-mono">{job.error}</p>
                  </div>
                )}
                <div className="mt-4">
                  <Button onClick={handleBackToCompanies} className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Activity Logs */}
          <div className="lg:col-span-1">
            <JobLogs 
              messages={messages} 
              autoScroll={true} 
              connectionStatus={connectionStatus}
            />
          </div>
        </div>

        {/* WebSocket Connection Status */}
        {isConnected && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-green-900/20 border border-green-800 text-green-300 px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live updates active</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </JobErrorBoundary>
  );
}