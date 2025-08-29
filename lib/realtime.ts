'use client';

import { useState, useEffect } from 'react';

export interface RealtimeMessage {
  id: string;
  conversationId: string;
  content: string;
  translatedContent?: string;
  senderId: string;
  senderName: string;
  senderImageUrl?: string;
  timestamp: Date;
  originalLanguage?: string;
  targetLanguage?: string;
  isTranslated: boolean;
}

export interface RealtimeEvents {
  'message:new': (message: RealtimeMessage) => void;
  'message:translated': (data: { messageId: string; translatedContent: string; targetLanguage: string }) => void;
  'user:typing': (data: { userId: string; userName: string; conversationId: string; isTyping: boolean }) => void;
  'user:online': (data: { userId: string; isOnline: boolean }) => void;
  'conversation:updated': (data: { conversationId: string; lastMessage?: string; timestamp: Date }) => void;
  'user:joined': (data: { userId: string; conversationId: string }) => void;
  'user:left': (data: { userId: string; conversationId: string }) => void;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: { [K in keyof RealtimeEvents]?: RealtimeEvents[K][] } = {};

  async connect(userId: string, token?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      this.userId = userId;
      
      // Use WebSocket for real-time communication
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws`
        : `ws://localhost:3001`;
      
      const url = `${wsUrl}?token=${encodeURIComponent(token || userId)}`;
      
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('Connected to realtime server');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Disconnected from realtime server:', event.code, event.reason);
          this.stopHeartbeat();
          
          if (event.code !== 1000) { // Not a normal closure
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed for user:', message.userId);
        break;
        
      case 'new_message':
        this.emit('message:new', message.data);
        break;
        
      case 'message_translated':
        this.emit('message:translated', message.data);
        break;
        
      case 'typing':
        this.emit('user:typing', message.data);
        break;
        
      case 'user_online':
        this.emit('user:online', message.data);
        break;
        
      case 'conversation_updated':
        this.emit('conversation:updated', message.data);
        break;
        
      case 'user_joined':
        this.emit('user:joined', message.data);
        break;
        
      case 'user_left':
        this.emit('user:left', message.data);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      case 'error':
        console.error('WebSocket server error:', message.message);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.userId) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(this.userId);
      }
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  // Event emitter functionality
  on<K extends keyof RealtimeEvents>(event: K, listener: RealtimeEvents[K]) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]!.push(listener);
  }

  off<K extends keyof RealtimeEvents>(event: K, listener: RealtimeEvents[K]) {
    if (!this.eventListeners[event]) return;
    const index = this.eventListeners[event]!.indexOf(listener);
    if (index > -1) {
      this.eventListeners[event]!.splice(index, 1);
    }
  }

  private emit<K extends keyof RealtimeEvents>(event: K, ...args: Parameters<RealtimeEvents[K]>) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event]!.forEach(listener => {
      try {
        (listener as any)(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Message operations
  sendMessage(message: Omit<RealtimeMessage, 'id' | 'timestamp'>) {
    this.send({
      type: 'message',
      data: {
        ...message,
        timestamp: new Date(),
      }
    });
  }

  joinConversation(conversationId: string) {
    this.send({
      type: 'join_conversation',
      data: { conversationId }
    });
  }

  leaveConversation(conversationId: string) {
    this.send({
      type: 'leave_conversation',
      data: { conversationId }
    });
  }

  // Typing indicators
  setTyping(conversationId: string, isTyping: boolean) {
    this.send({
      type: 'typing',
      data: { conversationId, isTyping }
    });
  }

  // Translation requests
  requestTranslation(messageId: string, targetLanguage: string) {
    this.send({
      type: 'translate_message',
      data: { messageId, targetLanguage }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.userId = null;
    this.eventListeners = {};
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || false;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;

// React hook for using realtime service
export function useRealtime(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');

  useEffect(() => {
    if (!userId) return;

    const connect = async () => {
      try {
        await realtimeService.connect(userId);
        setIsConnected(true);
        setConnectionState('connected');
      } catch (error) {
        console.error('Failed to connect to realtime service:', error);
        setIsConnected(false);
        setConnectionState('error');
      }
    };

    connect();

    // Update connection state periodically
    const interval = setInterval(() => {
      const state = realtimeService.getConnectionState();
      setConnectionState(state);
      setIsConnected(state === 'connected');
    }, 1000);

    return () => {
      clearInterval(interval);
      realtimeService.disconnect();
    };
  }, [userId]);

  return {
    isConnected,
    connectionState,
    service: realtimeService,
  };
}