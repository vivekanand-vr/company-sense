"use client";

import React from "react";
import { Loader2, Building2, BarChart3 } from "lucide-react";

interface JobLoadingProps {
  message?: string;
}

export function JobLoading({ message = "Loading job details..." }: JobLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated Icons */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="relative">
              <Building2 className="w-8 h-8 text-blue-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
            </div>
            <div className="w-12 h-0.5 bg-blue-500 rounded-full animate-pulse"></div>
            <BarChart3 className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin" />
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">{message}</h2>
          <p className="text-gray-400">
            Please wait while we prepare your job monitoring dashboard...
          </p>
        </div>

        {/* Loading Steps */}
        <div className="mt-8 space-y-2 text-sm text-gray-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <span>Connecting to job service</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <span>Fetching job status</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span>Loading activity logs</span>
          </div>
        </div>
      </div>
    </div>
  );
}