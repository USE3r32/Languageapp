'use client';

import { useState, useEffect } from 'react';

interface OnlineStatusProps {
  userId: string;
  showText?: boolean;
  className?: string;
}

export default function OnlineStatus({ userId, showText = false, className = '' }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  // Mock online status - in real app, this would connect to real-time presence
  useEffect(() => {
    // Simulate online status
    setIsOnline(Math.random() > 0.3); // 70% chance of being online
    setLastSeen(new Date(Date.now() - Math.random() * 3600000)); // Random last seen within last hour
  }, [userId]);

  if (showText) {
    return (
      <div className={`text-sm ${className}`}>
        {isOnline ? (
          <span className="text-green-600 font-medium">Active now</span>
        ) : (
          <span className="text-gray-500">
            Active {lastSeen ? formatLastSeen(lastSeen) : 'recently'}
          </span>
        )}
      </div>
    );
  }

  return isOnline ? <div className="online-indicator" /> : null;
}

function formatLastSeen(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}
