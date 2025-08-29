'use client';

import { useState } from 'react';
import ReactCardFlip from 'react-card-flip';
import { RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  originalContent?: string;
  senderId: string;
  senderName?: string;
  senderImageUrl?: string;
  timestamp: string;
  originalLanguage?: string;
  translatedContent?: string;
  targetLanguage?: string;
  isTranslated?: boolean;
}

interface FlipCardMessageProps {
  message: Message;
  isOwn: boolean;
}

export default function FlipCardMessage({ message, isOwn }: FlipCardMessageProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Determine if this message has translation data
  const hasTranslation = message.translatedContent && message.translatedContent !== message.content;

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasTranslation) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (hasTranslation && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsFlipped(!isFlipped);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex mb-3 px-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end max-w-xs sm:max-w-sm lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar - Only for received messages */}
        {!isOwn && (
          <div className="flex-shrink-0 mr-2 mb-1">
            {message.senderImageUrl ? (
              <img
                src={message.senderImageUrl}
                alt={message.senderName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message Container */}
        <div className="flex flex-col">
          {/* Sender Name - Only for received messages */}
          {!isOwn && (
            <span className="text-xs text-gray-500 mb-1 ml-3">
              {message.senderName || 'Unknown User'}
            </span>
          )}

          {/* Flip Card Container */}
          <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">

            {/* FRONT: Translated/Default Message - CLICKABLE MESSENGER STYLE */}
            <div
              key="front"
              onClick={handleMessageClick}
              onKeyDown={handleKeyPress}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              tabIndex={hasTranslation ? 0 : -1}
              role={hasTranslation ? 'button' : undefined}
              aria-label={hasTranslation ? 'Click to see original message' : undefined}
              className={`relative px-4 py-3 rounded-3xl shadow-sm transition-all duration-200 ${
                isOwn
                  ? 'bg-blue-500 text-white rounded-br-lg ml-auto'
                  : 'bg-gray-200 text-gray-900 rounded-bl-lg'
              } ${
                hasTranslation
                  ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
                  : ''
              }`}
              style={{
                maxWidth: '280px',
                wordWrap: 'break-word',
                wordBreak: 'break-word'
              }}
              title={hasTranslation ? '💬 Click to see original message' : ''}
            >
              {/* Translation Indicator */}
              {hasTranslation && (
                <div className={`flex items-center justify-between text-xs mb-1 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                  <span className="font-medium">🌍 Translated</span>
                  <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                    isHovering ? 'opacity-100' : 'opacity-60'
                  }`}>
                    <RotateCcw className={`w-3 h-3 transition-transform duration-200 ${
                      isHovering ? 'rotate-180' : ''
                    }`} />
                    <span className="text-[10px]">Click to flip</span>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="text-[15px] leading-[1.4]">
                {hasTranslation && !isFlipped ? message.translatedContent : message.content}
              </div>

              {/* Visual Indicator for Clickable Messages */}
              {hasTranslation && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  isOwn ? 'bg-blue-200' : 'bg-blue-500'
                } opacity-60 animate-pulse`}></div>
              )}
            </div>

            {/* BACK: Original Message - CLICKABLE MESSENGER STYLE */}
            <div
              key="back"
              onClick={handleMessageClick}
              onKeyDown={handleKeyPress}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              tabIndex={0}
              role="button"
              aria-label="Click to see translated message"
              className={`relative px-4 py-3 rounded-3xl shadow-sm border transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                isOwn
                  ? 'bg-gray-100 text-gray-900 rounded-br-lg border-gray-300 ml-auto'
                  : 'bg-blue-50 text-gray-900 rounded-bl-lg border-blue-200'
              }`}
              style={{
                maxWidth: '280px',
                wordWrap: 'break-word',
                wordBreak: 'break-word'
              }}
              title="💬 Click to see translated message"
            >
              {/* Original Indicator */}
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span className="font-medium">📝 Original</span>
                <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                  isHovering ? 'opacity-100' : 'opacity-60'
                }`}>
                  <RotateCcw className={`w-3 h-3 transition-transform duration-200 ${
                    isHovering ? 'rotate-180' : ''
                  }`} />
                  <span className="text-[10px]">Click to flip</span>
                </div>
              </div>

              {/* Original Content */}
              <div className="text-[15px] leading-[1.4]">
                {message.originalContent || message.content}
              </div>

              {/* Visual Indicator for Clickable Messages */}
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                isOwn ? 'bg-gray-400' : 'bg-blue-400'
              } opacity-60 animate-pulse`}></div>
            </div>

          </ReactCardFlip>

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
