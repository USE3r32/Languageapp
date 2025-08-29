import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

// Store active SSE connections
const connections = new Map<string, { 
  controller: ReadableStreamDefaultController;
  userId: string;
  conversationIds: Set<string>;
}>();

// Store conversation subscribers
const conversationSubscribers = new Map<string, Set<string>>();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    console.log(`🔗 SSE Connection: User ${userId} connecting to conversation ${conversationId}`);

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Store connection
        const connectionId = `${userId}-${Date.now()}`;
        connections.set(connectionId, {
          controller,
          userId,
          conversationIds: new Set(conversationId ? [conversationId] : [])
        });

        // Subscribe to conversation if specified
        if (conversationId) {
          if (!conversationSubscribers.has(conversationId)) {
            conversationSubscribers.set(conversationId, new Set());
          }
          conversationSubscribers.get(conversationId)?.add(connectionId);
        }

        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          userId,
          timestamp: new Date().toISOString()
        })}\n\n`);

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`);
          } catch (error) {
            clearInterval(heartbeat);
            connections.delete(connectionId);
            if (conversationId) {
              conversationSubscribers.get(conversationId)?.delete(connectionId);
            }
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          connections.delete(connectionId);
          if (conversationId) {
            conversationSubscribers.get(conversationId)?.delete(connectionId);
          }
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE connection error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Enhanced broadcast message to conversation subscribers
export function broadcastToConversation(conversationId: string, message: any) {
  const subscribers = conversationSubscribers.get(conversationId);
  console.log(`📡 Broadcasting to conversation ${conversationId}: ${subscribers?.size || 0} subscribers`);

  if (!subscribers || subscribers.size === 0) {
    console.log(`❌ No subscribers found for conversation ${conversationId}`);
    return { success: false, reason: 'no_subscribers', count: 0 };
  }

  const messageData = `data: ${JSON.stringify({
    ...message,
    timestamp: message.timestamp || new Date().toISOString(),
    conversationId
  })}\n\n`;

  let successCount = 0;
  let failureCount = 0;
  const failedConnections: string[] = [];

  for (const connectionId of subscribers) {
    const connection = connections.get(connectionId);
    if (connection) {
      try {
        console.log(`✅ Sending message to connection ${connectionId} (user: ${connection.userId})`);
        connection.controller.enqueue(messageData);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to send to connection ${connectionId}:`, error);
        failureCount++;
        failedConnections.push(connectionId);

        // Connection closed, clean up
        connections.delete(connectionId);
        subscribers.delete(connectionId);
      }
    } else {
      // Connection not found, clean up subscriber
      subscribers.delete(connectionId);
      failureCount++;
      failedConnections.push(connectionId);
    }
  }

  console.log(`📊 Broadcast results: ${successCount} success, ${failureCount} failures`);

  return {
    success: successCount > 0,
    successCount,
    failureCount,
    failedConnections,
    totalSubscribers: subscribers.size
  };
}

// Broadcast to all connections of a specific user
export function broadcastToUser(userId: string, message: any) {
  const messageData = `data: ${JSON.stringify(message)}\n\n`;
  
  for (const [connectionId, connection] of connections) {
    if (connection.userId === userId) {
      try {
        connection.controller.enqueue(messageData);
      } catch (error) {
        // Connection closed, clean up
        connections.delete(connectionId);
      }
    }
  }
}

// Export broadcast functions for use in other API routes
export { broadcastToConversation as broadcast };
