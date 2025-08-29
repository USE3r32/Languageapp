import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  addConnection,
  removeConnection,
  addSubscriber,
  removeSubscriber
} from '@/lib/sse-broadcast';

export const runtime = 'nodejs';

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
        addConnection(connectionId, {
          controller,
          userId,
          conversationIds: new Set(conversationId ? [conversationId] : [])
        });

        // Subscribe to conversation if specified
        if (conversationId) {
          addSubscriber(conversationId, connectionId);
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
            removeConnection(connectionId);
            if (conversationId) {
              removeSubscriber(conversationId, connectionId);
            }
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          removeConnection(connectionId);
          if (conversationId) {
            removeSubscriber(conversationId, connectionId);
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


