'use client';

import { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Globe, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  originalContent?: string;
  translatedContent?: string;
  senderId: string;
  senderName: string;
  senderImageUrl?: string;
  timestamp: string;
  originalLanguage?: string;
  targetLanguage?: string;
  isTranslated?: boolean;
  confidence?: number;
}

interface MessengerMessageProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

export default function MessengerMessage({ message, isOwn, showAvatar = true }: MessengerMessageProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Check if message has translation
  const hasTranslation = Boolean(
    message.isTranslated && 
    message.translatedContent && 
    message.translatedContent !== message.content
  );

  // Get display content based on flip state
  const displayContent = hasTranslation && !isFlipped 
    ? message.translatedContent 
    : (message.originalContent || message.content);

  // Handle flip interaction
  const handleFlip = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasTranslation) {
      setIsFlipped(!isFlipped);
    }
  }, [hasTranslation, isFlipped]);

  // Handle keyboard interaction
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (hasTranslation && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsFlipped(!isFlipped);
    }
  }, [hasTranslation, isFlipped]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex items-end gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (only for received messages and when showAvatar is true) */}
      {!isOwn && showAvatar && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.senderImageUrl} />
          <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">
            {message.senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer for alignment when no avatar */}
      {!isOwn && !showAvatar && <div className="w-8" />}

      {/* Message Bubble */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[280px]`}>
        {/* Sender name (only for received messages when showing avatar) */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-gray-500 mb-1 px-2">
            {message.senderName}
          </span>
        )}

        {/* Message Content */}
        <div
          onClick={hasTranslation ? handleFlip : undefined}
          onKeyDown={hasTranslation ? handleKeyPress : undefined}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          tabIndex={hasTranslation ? 0 : -1}
          role={hasTranslation ? 'button' : undefined}
          aria-label={hasTranslation ? 'Click to toggle between original and translated message' : undefined}
          className={`
            message-bubble
            ${isOwn ? 'sent' : 'received'}
            ${hasTranslation ? 'translation-available messenger-focusable' : ''}
            relative group
          `}
        >
          {/* Translation Status Indicator */}
          {hasTranslation && (
            <div className={`
              flex items-center justify-between text-xs mb-2 
              ${isOwn ? 'text-blue-100' : 'text-gray-600'}
            `}>
              <div className="flex items-center gap-1">
                {isFlipped ? (
                  <>
                    <FileText className="w-3 h-3" />
                    <span className="font-medium">Original</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" />
                    <span className="font-medium">Translated</span>
                  </>
                )}
                {message.confidence && (
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-1 py-0 h-4 bg-black/10 text-current border-0"
                  >
                    {Math.round(message.confidence * 100)}%
                  </Badge>
                )}
              </div>
              
              {/* Flip Indicator */}
              <div className={`
                flex items-center gap-1 transition-opacity duration-200
                ${isHovering ? 'opacity-100' : 'opacity-60'}
              `}>
                <RotateCcw className={`
                  w-3 h-3 transition-transform duration-200
                  ${isHovering ? 'rotate-180' : ''}
                `} />
                <span className="text-[10px]">Click</span>
              </div>
            </div>
          )}

          {/* Message Text */}
          <div className="text-[15px] leading-[1.4] whitespace-pre-wrap">
            {displayContent}
          </div>

          {/* Language Info (for translated messages) */}
          {hasTranslation && (
            <div className={`
              text-[11px] mt-2 pt-1 border-t border-current/20
              ${isOwn ? 'text-blue-100' : 'text-gray-500'}
            `}>
              {isFlipped ? (
                <span>
                  {message.originalLanguage && message.originalLanguage !== 'auto' 
                    ? `Original: ${message.originalLanguage.toUpperCase()}`
                    : 'Original message'
                  }
                </span>
              ) : (
                <span>
                  {message.targetLanguage 
                    ? `Translated to ${message.targetLanguage.toUpperCase()}`
                    : 'Auto-translated'
                  }
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`
          text-xs text-gray-500 mt-1 px-2
          ${isOwn ? 'text-right' : 'text-left'}
        `}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
