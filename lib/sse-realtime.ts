'use client';

interface RealtimeMessage {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImageUrl?: string;
  timestamp: string;
  originalLanguage?: string;
  isTranslated: boolean;
}

interface RealtimeEvents {
  'message:new': (message: RealtimeMessage) => void;
  'message:translated': (data: { messageId: string; translatedContent: string; targetLanguage: string }) => void;
  'user:typing': (data: { userId: string; conversationId: string; isTyping: boolean }) => void;
  'user:online': (data: { userId: string; isOnline: boolean }) => void;
  'conversation:updated': (data: any) => void;
  'user:joined': (data: { userId: string; conversationId: string }) => void;
  'user:left': (data: { userId: string; conversationId: string }) => void;
  'connected': () => void;
  'disconnected': () => void;
  'error': (error: Error) => void;
}

class SSERealtimeService {
  private eventSource: EventSource | null = null;
  private userId: string | null = null;
  private conversationId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: { [K in keyof RealtimeEvents]?: RealtimeEvents[K][] } = {};

  async connect(userId: string, conversationId?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.eventSource?.readyState === EventSource.OPEN) {
        console.log('🔗 SSE already connected');
        resolve(true);
        return;
      }

      this.userId = userId;
      this.conversationId = conversationId || null;

      // Build SSE URL
      const url = new URL('/api/realtime', window.location.origin);
      if (conversationId) {
        url.searchParams.set('conversationId', conversationId);
      }

      console.log(`🔗 Connecting to SSE: ${url.toString()}`);

      try {
        this.eventSource = new EventSource(url.toString());
        
        this.eventSource.onopen = () => {
          console.log('✅ Connected to SSE realtime server');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve(true);
        };

        this.eventSource.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received SSE message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing SSE message:', error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE error:', error);
          this.emit('disconnected');
          
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.handleReconnect();
          }
        };

      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    console.log('🔄 Processing SSE message:', message.type, message.data);

    switch (message.type) {
      case 'connected':
        console.log('✅ SSE connection confirmed for user:', message.userId);
        this.showNotification('Connected', 'Real-time messaging is active', 'success');
        break;

      case 'heartbeat':
        // Keep connection alive - silent
        console.log('💓 Heartbeat received');
        break;

      case 'new_message':
        console.log('📨 New message received:', message.data);
        this.emit('message:new', message.data);

        // Show notification for new messages (if not from current user)
        if (message.data.senderId !== this.userId) {
          this.showNotification(
            `New message from ${message.data.senderName}`,
            message.data.content.substring(0, 50) + (message.data.content.length > 50 ? '...' : ''),
            'message'
          );

          // Play notification sound
          this.playNotificationSound();
        }
        break;

      case 'message_translated':
        console.log('🌍 Message translated:', message.data);
        this.emit('message:translated', message.data);
        break;

      case 'typing':
        console.log('⌨️ Typing indicator:', message.data);
        this.emit('user:typing', message.data);
        break;

      case 'user_online':
        console.log('🟢 User online status:', message.data);
        this.emit('user:online', message.data);

        if (message.data.isOnline && message.data.userId !== this.userId) {
          this.showNotification('User Online', `${message.data.userName || 'Someone'} is now online`, 'info');
        }
        break;

      case 'conversation_updated':
        console.log('💬 Conversation updated:', message.data);
        this.emit('conversation:updated', message.data);
        break;

      case 'user_joined':
        console.log('👋 User joined:', message.data);
        this.emit('user:joined', message.data);
        this.showNotification('User Joined', `${message.data.userName || 'Someone'} joined the conversation`, 'info');
        break;

      case 'user_left':
        console.log('👋 User left:', message.data);
        this.emit('user:left', message.data);
        this.showNotification('User Left', `${message.data.userName || 'Someone'} left the conversation`, 'info');
        break;

      case 'error':
        console.error('❌ SSE error received:', message.data);
        this.emit('error', new Error(message.data.message || 'Unknown error'));
        this.showNotification('Connection Error', message.data.message || 'Something went wrong', 'error');
        break;

      default:
        console.warn('⚠️ Unknown SSE message type:', message.type, message.data);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Failed to reconnect after maximum attempts'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId, this.conversationId || undefined);
      }
    }, delay);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.emit('disconnected');
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

  // Send typing indicator
  sendTyping(conversationId: string, isTyping: boolean) {
    // In a real implementation, this would send to the backend
    // For now, we'll emit locally for demo purposes
    this.emit('user:typing', {
      userId: this.userId || '',
      conversationId,
      isTyping
    });
  }

  // Notification methods
  private showNotification(title: string, body: string, type: 'success' | 'error' | 'info' | 'message' = 'info') {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `realtime-${type}`,
        requireInteraction: type === 'message',
        silent: type === 'info'
      });

      // Auto-close after 5 seconds for non-message notifications
      if (type !== 'message') {
        setTimeout(() => notification.close(), 5000);
      }
    }

    // Console notification with emoji
    const emoji = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      message: '📨'
    }[type];

    console.log(`${emoji} ${title}: ${body}`);

    // Emit custom notification event for UI components
    this.emit('notification' as any, { title, body, type });
  }

  private playNotificationSound() {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create a simple notification beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notifications are blocked by user');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  getConnectionState(): string {
    if (!this.eventSource) return 'disconnected';

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING: return 'connecting';
      case EventSource.OPEN: return 'connected';
      case EventSource.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  // Enhanced connection info
  getConnectionInfo(): {
    state: string;
    userId: string | null;
    conversationId: string | null;
    reconnectAttempts: number;
    isConnected: boolean;
  } {
    return {
      state: this.getConnectionState(),
      userId: this.userId,
      conversationId: this.conversationId,
      reconnectAttempts: this.reconnectAttempts,
      isConnected: this.isConnected()
    };
  }
}

// Singleton instance
let realtimeService: SSERealtimeService | null = null;

export function getRealtimeService(): SSERealtimeService {
  if (!realtimeService) {
    realtimeService = new SSERealtimeService();
  }
  return realtimeService;
}

export default SSERealtimeService;
export type { RealtimeMessage, RealtimeEvents };
