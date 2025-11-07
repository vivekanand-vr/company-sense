"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  isLoading: boolean;
  currentProgress?: number;
  message?: string;
  total?: number;
  processed?: number;
}

export function ProgressIndicator({ 
  isLoading, 
  currentProgress, 
  message, 
  total, 
  processed 
}: ProgressIndicatorProps) {
  if (!isLoading) return null;

  const progressPercentage = currentProgress || 
    (total && processed ? (processed / total) * 100 : 0);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 border rounded-lg bg-muted/50">
      <div className="flex items-center space-x-3 mb-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="font-medium">Processing Companies...</span>
      </div>
      
      <Progress value={progressPercentage} className="w-full mb-3" />
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {message || "Extracting company information..."}
        </span>
        {total && processed !== undefined && (
          <span>
            {processed} / {total} completed
          </span>
        )}
      </div>
    </div>
  );
}