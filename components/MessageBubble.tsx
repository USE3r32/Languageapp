'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Languages } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  translatedContent?: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  originalLanguage?: string;
  targetLanguage?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTranslation: boolean;
  onTranslate?: () => void;
}

export default function MessageBubble({ message, isOwn, showTranslation, onTranslate }: MessageBubbleProps) {
  const displayContent = showTranslation && message.translatedContent 
    ? message.translatedContent 
    : message.content;

  const canTranslate = showTranslation && !message.translatedContent && !isOwn;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`message-bubble ${isOwn ? 'message-sent' : 'message-received'} max-w-[85%] sm:max-w-[70%]`}>
        {!isOwn && (
          <div className="text-xs font-semibold mb-2 text-gray-600">
            {message.senderName}
          </div>
        )}
        
        <div className="text-sm leading-relaxed mb-2">
          {displayContent}
        </div>
        
        {showTranslation && message.translatedContent && message.translatedContent !== message.content && (
          <>
            <Separator className="my-2 opacity-30" />
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs px-2 py-0">
                  Original
                </Badge>
                <span className="opacity-75">{message.content}</span>
              </div>
            </div>
          </>
        )}
        
        {canTranslate && onTranslate && (
          <div className="mt-3 pt-2 border-t border-opacity-20 border-gray-400">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTranslate}
              className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 h-auto rounded-md"
            >
              <Languages className="w-3 h-3 mr-1" />
              Translate
            </Button>
          </div>
        )}
        
        <div className={`text-xs mt-3 ${isOwn ? 'text-black opacity-70' : 'text-gray-500'} text-right`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
}