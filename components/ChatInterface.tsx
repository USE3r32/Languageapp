'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import FlipCardMessage from './FlipCardMessage';
import LanguageSelector from './LanguageSelector';
import RealtimeStatus from './RealtimeStatus';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { getRealtimeService } from '@/lib/sse-realtime';
import type { RealtimeMessage } from '@/lib/sse-realtime';
// Push notifications will be added later

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

interface ChatInterfaceProps {
  conversationId: string;
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // const [pushEnabled, setPushEnabled] = useState(false); // TODO: Add push notifications
  // Translation is now always enabled and invisible
  // const [translationEnabled, setTranslationEnabled] = useState(false);
  // const [targetLanguage, setTargetLanguage] = useState('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const realtimeService = useRef(getRealtimeService());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Push notifications will be implemented later
  useEffect(() => {
    // TODO: Add push notification initialization
    console.log('💬 Chat interface loaded for user:', user?.id);
  }, [user?.id]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      setLoading(true);
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  // Real-time connection setup
  useEffect(() => {
    console.log(`🔗 ChatInterface useEffect: user=${user?.id}, conversationId=${conversationId}`);

    if (!user?.id || !conversationId) {
      console.log('❌ Missing user ID or conversation ID, skipping SSE connection');
      return;
    }

    console.log(`🚀 Establishing SSE connection for user ${user.id} to conversation ${conversationId}`);
    const realtime = realtimeService.current;

    // Connect to real-time service
    realtime.connect(user.id, conversationId);

    // Handle new messages
    const handleNewMessage = (message: RealtimeMessage) => {
      // Don't add our own messages (they're already added optimistically)
      if (message.senderId === user.id) return;

      setMessages(prev => {
        // Check if message already exists
        if (prev.some(m => m.id === message.id)) return prev;

        return [...prev, {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName,
          timestamp: message.timestamp,
          originalLanguage: message.originalLanguage,
        }];
      });
    };

    // Handle connection events
    const handleConnected = () => {
      console.log('Real-time connection established');
    };

    const handleDisconnected = () => {
      console.log('Real-time connection lost');
    };

    // Subscribe to events
    realtime.on('message:new', handleNewMessage);
    realtime.on('connected', handleConnected);
    realtime.on('disconnected', handleDisconnected);

    // Cleanup on unmount
    return () => {
      realtime.off('message:new', handleNewMessage);
      realtime.off('connected', handleConnected);
      realtime.off('disconnected', handleDisconnected);
      realtime.disconnect();
    };
  }, [user?.id, conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Optimistic update - add message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: user.id,
      senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You',
      timestamp: new Date().toISOString(),
      originalLanguage: 'auto',
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          originalLanguage: 'auto',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const serverMessage = data.data;

        // Replace optimistic message with server message
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessage.id
            ? {
                id: serverMessage.id,
                content: serverMessage.content,
                senderId: serverMessage.senderId,
                senderName: serverMessage.senderName,
                timestamp: serverMessage.timestamp,
                originalLanguage: serverMessage.originalLanguage,
              }
            : msg
        ));

        // Translation now happens automatically on the server
        // Messages arrive already translated to user's preferred language
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120; // 5 lines approximately
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  };

  // Translation is now handled automatically on the server
  // No need for manual translation functions

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Mobile-First Header - MESSENGER STYLE */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RealtimeStatus
                userId={user?.id}
                conversationId={conversationId}
                className="flex-shrink-0"
              />
              <span className="text-sm font-medium text-gray-800">
                Auto-translate active
              </span>
            </div>
            <LanguageSelector
              className="max-w-32"
              showLabel={false}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      {/* Messages - MESSENGER STYLE */}
      <ScrollArea className="flex-1 bg-gray-50">
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-64 px-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">No messages yet</p>
                <p className="text-sm text-gray-500">Start a conversation and messages will be translated automatically</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message) => (
                <FlipCardMessage
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.id}
                />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input - MESSENGER STYLE */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
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
            size="icon"
            className="w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0 shadow-lg transition-all duration-200 hover:scale-105"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}