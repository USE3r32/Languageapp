// Store active SSE connections
const connections = new Map<string, { 
  controller: ReadableStreamDefaultController;
  userId: string;
  conversationIds: Set<string>;
}>();

// Store conversation subscribers
const conversationSubscribers = new Map<string, Set<string>>();

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

// Connection management functions
export function addConnection(connectionId: string, connection: {
  controller: ReadableStreamDefaultController;
  userId: string;
  conversationIds: Set<string>;
}) {
  connections.set(connectionId, connection);
}

export function removeConnection(connectionId: string) {
  connections.delete(connectionId);
}

export function addSubscriber(conversationId: string, connectionId: string) {
  if (!conversationSubscribers.has(conversationId)) {
    conversationSubscribers.set(conversationId, new Set());
  }
  conversationSubscribers.get(conversationId)?.add(connectionId);
}

export function removeSubscriber(conversationId: string, connectionId: string) {
  conversationSubscribers.get(conversationId)?.delete(connectionId);
}

export function getConnection(connectionId: string) {
  return connections.get(connectionId);
}

export function getSubscribers(conversationId: string) {
  return conversationSubscribers.get(conversationId);
}
