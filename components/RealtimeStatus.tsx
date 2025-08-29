'use client';

import { useState, useEffect } from 'react';
import { getRealtimeService } from '@/lib/sse-realtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Bell, BellOff } from 'lucide-react';

interface RealtimeStatusProps {
  userId?: string;
  conversationId?: string;
  className?: string;
}

export default function RealtimeStatus({ userId, conversationId, className = '' }: RealtimeStatusProps) {
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<any>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const realtimeService = getRealtimeService();

  useEffect(() => {
    // Check initial notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Update connection state
    const updateConnectionState = () => {
      setConnectionState(realtimeService.getConnectionState());
      setConnectionInfo(realtimeService.getConnectionInfo());
    };

    // Set up event listeners
    const handleConnected = () => {
      updateConnectionState();
      setIsReconnecting(false);
    };

    const handleDisconnected = () => {
      updateConnectionState();
      setIsReconnecting(false);
    };

    const handleError = (error: Error) => {
      console.error('Realtime connection error:', error);
      updateConnectionState();
      setIsReconnecting(false);
    };

    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);
    realtimeService.on('error', handleError);

    // Initial state update
    updateConnectionState();

    // Auto-connect if userId is provided
    if (userId && !realtimeService.isConnected()) {
      handleConnect();
    }

    return () => {
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
      realtimeService.off('error', handleError);
    };
  }, [userId, conversationId]);

  const handleConnect = async () => {
    if (!userId) return;
    
    setIsReconnecting(true);
    try {
      await realtimeService.connect(userId, conversationId);
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsReconnecting(false);
    }
  };

  const handleDisconnect = () => {
    realtimeService.disconnect();
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await realtimeService.requestNotificationPermission();
      setNotificationsEnabled(granted);
    } else {
      // Can't programmatically disable notifications, just update state
      setNotificationsEnabled(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (isReconnecting) return 'Reconnecting...';
    switch (connectionState) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    if (isReconnecting) return <RefreshCw className="w-3 h-3 animate-spin" />;
    switch (connectionState) {
      case 'connected': return <Wifi className="w-3 h-3" />;
      case 'connecting': return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'disconnected': return <WifiOff className="w-3 h-3" />;
      default: return <WifiOff className="w-3 h-3" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection Status Badge */}
      <Badge 
        variant="secondary" 
        className={`text-xs text-white border-0 ${getStatusColor()}`}
      >
        <div className="flex items-center space-x-1">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </Badge>

      {/* Connection Actions */}
      {connectionState === 'disconnected' && userId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleConnect}
          disabled={isReconnecting}
          className="h-6 px-2 text-xs"
        >
          {isReconnecting ? 'Connecting...' : 'Connect'}
        </Button>
      )}

      {connectionState === 'connected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="h-6 px-2 text-xs"
        >
          Disconnect
        </Button>
      )}

      {/* Notification Toggle */}
      {connectionState === 'connected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleNotifications}
          className="h-6 w-6 p-0"
          title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          {notificationsEnabled ? (
            <Bell className="w-3 h-3 text-green-600" />
          ) : (
            <BellOff className="w-3 h-3 text-gray-400" />
          )}
        </Button>
      )}

      {/* Debug Info (Development) */}
      {process.env.NODE_ENV === 'development' && connectionInfo.reconnectAttempts > 0 && (
        <Badge variant="outline" className="text-xs">
          Retries: {connectionInfo.reconnectAttempts}
        </Badge>
      )}
    </div>
  );
}
