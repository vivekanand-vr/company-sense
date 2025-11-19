"use client";

import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class JobErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Job page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-900/20 border border-red-800 text-red-300 p-6 rounded-xl mb-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-sm mb-4 text-red-400">
                An error occurred while loading the job status page.
              </p>
              {this.state.error && (
                <details className="text-xs text-left mt-4 p-3 bg-red-900/30 rounded border border-red-800">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details
                  </summary>
                  <pre className="whitespace-pre-wrap overflow-x-auto text-red-300">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="space-x-3">
              <Button 
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/companies'}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Back to Companies
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}