'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import MessengerMessage from './MessengerMessage';
import TypingIndicator from './TypingIndicator';
import OnlineStatus from './OnlineStatus';
import { getRealtimeService } from '@/lib/sse-realtime';
import type { RealtimeMessage } from '@/lib/sse-realtime';

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

interface MessengerInterfaceProps {
  conversationId: string;
  conversationName?: string;
  isGroup?: boolean;
  onBack?: () => void;
}

export default function MessengerInterface({ 
  conversationId, 
  conversationName = 'Chat',
  isGroup = false,
  onBack 
}: MessengerInterfaceProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const realtimeService = useRef(getRealtimeService());
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, user, scrollToBottom]);

  // Real-time connection
  useEffect(() => {
    if (!user) return;

    const realtime = realtimeService.current;
    realtime.connect(user.id, conversationId);

    // Handle new messages
    const handleNewMessage = (message: RealtimeMessage) => {
      if (message.senderId === user.id) return; // Skip own messages

      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;

        const newMsg: Message = {
          id: message.id,
          content: message.content,
          originalContent: message.originalContent,
          translatedContent: message.translatedContent,
          senderId: message.senderId,
          senderName: message.senderName || 'Unknown',
          senderImageUrl: message.senderImageUrl,
          timestamp: message.timestamp,
          originalLanguage: message.originalLanguage,
          targetLanguage: message.targetLanguage,
          isTranslated: message.isTranslated,
          confidence: message.confidence,
        };

        return [...prev, newMsg];
      });

      setTimeout(scrollToBottom, 100);
    };

    // Handle typing indicators
    const handleTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.userId === user.id || data.conversationId !== conversationId) return;

      setOtherUserTyping(prev => {
        const userName = `User ${data.userId.slice(-4)}`; // Simple user name from ID
        if (data.isTyping) {
          return prev.includes(userName) ? prev : [...prev, userName];
        } else {
          return prev.filter(name => name !== userName);
        }
      });
    };

    realtime.on('message:new', handleNewMessage);
    realtime.on('user:typing', handleTyping);

    return () => {
      realtime.off('message:new', handleNewMessage);
      realtime.off('user:typing', handleTyping);
      realtime.disconnect();
    };
  }, [user, conversationId, scrollToBottom]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      realtimeService.current.sendTyping(conversationId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      realtimeService.current.sendTyping(conversationId, false);
    }, 2000);
  }, [conversationId, isTyping]);

  // Handle message input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Stop typing indicator
    setIsTyping(false);
    realtimeService.current.sendTyping(conversationId, false);

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: user.id,
      senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You',
      senderImageUrl: user.imageUrl,
      timestamp: new Date().toISOString(),
      originalLanguage: 'auto',
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          originalLanguage: 'auto'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Remove optimistic message (real one will come via realtime)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove failed optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="messenger-container">
        <div className="flex items-center justify-center h-full">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="messenger-container">
      {/* 📱 MESSENGER HEADER */}
      <div className="messenger-header">
        <div className="flex items-center flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-2 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center flex-1">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder-avatar.png" />
                <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                  {conversationName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isGroup && <OnlineStatus userId="other-user" />}
            </div>
            
            <div className="ml-3 flex-1">
              <h1 className="font-semibold text-gray-900 text-base leading-tight">
                {conversationName}
              </h1>
              <OnlineStatus userId="other-user" showText className="text-sm" />
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
              <Phone className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
              <Video className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* 💬 MESSAGES AREA */}
      <div className="messenger-chat-area">
        <div className="messenger-messages">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">No messages yet</p>
                <p className="text-sm text-gray-500">Start the conversation with automatic translation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => (
                <MessengerMessage
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.id}
                  showAvatar={
                    index === 0 || 
                    messages[index - 1]?.senderId !== message.senderId
                  }
                />
              ))}
              
              {/* Typing Indicator */}
              {otherUserTyping.length > 0 && (
                <TypingIndicator users={otherUserTyping} />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ⌨️ MESSAGE INPUT */}
        <div className="messenger-input-area">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-3xl px-4 py-3 text-[15px] leading-[1.4] shadow-sm"
              rows={1}
              disabled={sending}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 p-0 flex items-center justify-center"
          >
            {sending ? (
              <div className="loading-spinner w-5 h-5 border-white border-t-transparent" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
