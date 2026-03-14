"use client";

import React from "react";
import { Wifi, WifiOff, RotateCcw, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebSocketStatusProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isConnected: boolean;
  onReconnect: () => void;
  usingFallback?: boolean;
  className?: string;
}

export function WebSocketStatus({ 
  connectionStatus, 
  isConnected, 
  onReconnect, 
  usingFallback = false,
  className = "" 
}: WebSocketStatusProps) {
  const getStatusConfig = () => {
    if (usingFallback) {
      return {
        icon: <RefreshCw className="w-4 h-4 text-blue-400" />,
        text: 'Polling Mode',
        bgColor: 'bg-blue-900/20',
        textColor: 'text-blue-300',
        borderColor: 'border-blue-800'
      };
    }

    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4 text-green-400" />,
          text: 'Live',
          bgColor: 'bg-green-900/20',
          textColor: 'text-green-300',
          borderColor: 'border-green-800'
        };
      case 'connecting':
        return {
          icon: <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />,
          text: 'Connecting...',
          bgColor: 'bg-yellow-900/20',
          textColor: 'text-yellow-300',
          borderColor: 'border-yellow-800'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
          text: 'Connection Error',
          bgColor: 'bg-red-900/20',
          textColor: 'text-red-300',
          borderColor: 'border-red-800'
        };
      case 'disconnected':
      default:
        return {
          icon: <WifiOff className="w-4 h-4 text-gray-400" />,
          text: 'Offline',
          bgColor: 'bg-gray-800/50',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-700'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Indicator */}
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
        {config.icon}
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>

      {/* Reconnect Button (shown when disconnected/error) */}
      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
        <Button
          size="sm"
          variant="outline"
          onClick={onReconnect}
          className="h-6 px-2 text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
}