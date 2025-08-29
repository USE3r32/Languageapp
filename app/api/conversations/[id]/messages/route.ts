import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/database';
import { broadcastToConversation, broadcastToUser } from '@/app/api/realtime/route';
import { translateMessage } from '@/lib/featherless';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const messages = await DatabaseService.getConversationMessages(conversationId, userId);
    
    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, originalLanguage } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const { id: conversationId } = await params;
    
    // Send message to database
    const message = await DatabaseService.sendMessage(userId, {
      conversationId,
      content: content.trim(),
      originalLanguage
    });

    // Get sender info and conversation members for real-time broadcast
    const sender = await DatabaseService.getUserByClerkId(userId);
    const conversationMembers = await DatabaseService.getConversationMembers(conversationId);

    // 🚀 AI TRANSLATION ADVANTAGE
    // Get recipient's preferred languages for auto-translation
    const recipients = conversationMembers.filter(member => member.clerkId !== userId);

    // Prepare base message for broadcasting
    const baseRealtimeMessage = {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      originalContent: message.content, // Store original for flip card
      senderId: message.senderId,
      senderName: `${sender?.firstName || ''} ${sender?.lastName || ''}`.trim() || 'Unknown User',
      senderImageUrl: sender?.imageUrl,
      timestamp: message.createdAt,
      originalLanguage: message.originalLanguage,
      isTranslated: false,
    };

    // Send original message to sender (no translation needed)
    broadcastToConversation(conversationId, {
      type: 'new_message',
      data: baseRealtimeMessage
    });

    // 🚀 OPTIMIZED REAL-TIME TRANSLATION WITH AI
    console.log(`📨 Processing message for ${recipients.length} recipients`);

    // Process translations in parallel for maximum speed
    const translationPromises = recipients.map(async (recipient) => {
      const startTime = Date.now();

      if (recipient.preferredLanguage && recipient.preferredLanguage !== originalLanguage) {
        try {
          console.log(`🌍 Translating for ${recipient.clerkId}: ${originalLanguage} → ${recipient.preferredLanguage}`);

          // Use optimized translation service
          const translationResult = await translateMessage(
            content.trim(),
            recipient.preferredLanguage,
            originalLanguage || 'auto'
          );

          const duration = Date.now() - startTime;
          console.log(`⚡ Translation completed in ${duration}ms for ${recipient.clerkId}`);

          if (translationResult.translatedText && (translationResult.confidence || 0) > 0) {
            // Send translated message to specific recipient
            const translatedMessage = {
              ...baseRealtimeMessage,
              content: translationResult.translatedText, // Show translated version
              originalContent: message.content, // Keep original for flip
              translatedContent: translationResult.translatedText,
              targetLanguage: recipient.preferredLanguage,
              detectedLanguage: translationResult.detectedLanguage,
              isTranslated: true,
              confidence: translationResult.confidence
            };

            // Broadcast translated message to specific user
            broadcastToUser(recipient.clerkId, {
              type: 'new_message',
              data: translatedMessage
            });

            console.log(`✅ Sent translated message to ${recipient.clerkId}`);
          } else {
            // Low confidence translation, send original
            console.warn(`⚠️ Low confidence translation for ${recipient.clerkId}, sending original`);
            broadcastToUser(recipient.clerkId, {
              type: 'new_message',
              data: baseRealtimeMessage
            });
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`❌ Translation failed for ${recipient.clerkId} after ${duration}ms:`, error);

          // Fallback: send original message
          broadcastToUser(recipient.clerkId, {
            type: 'new_message',
            data: baseRealtimeMessage
          });
        }
      } else {
        // No translation needed, send original
        console.log(`📤 Sending original message to ${recipient.clerkId} (same language)`);
        broadcastToUser(recipient.clerkId, {
          type: 'new_message',
          data: baseRealtimeMessage
        });
      }
    });

    // Wait for all translations to complete (with timeout)
    try {
      await Promise.allSettled(translationPromises);
      console.log(`🎯 All translations processed for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error processing translations:', error);
    }

    return NextResponse.json({
      success: true,
      data: baseRealtimeMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}