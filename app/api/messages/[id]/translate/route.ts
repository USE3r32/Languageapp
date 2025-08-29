import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/database';
import { getTranslator } from '@/lib/featherless';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetLanguage } = await request.json();

    if (!targetLanguage) {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      );
    }

    const { id: messageId } = await params;

    // Check if translation already exists
    const existingTranslation = await DatabaseService.getMessageTranslation(messageId, targetLanguage);
    
    if (existingTranslation) {
      return NextResponse.json({
        success: true,
        data: {
          messageId,
          translatedContent: existingTranslation.translatedText,
          targetLanguage,
          cached: true
        }
      });
    }

    // Get the original message
    const message = await DatabaseService.getMessageById(messageId);
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Translate the message using Featherless.AI
    const translator = getTranslator();
    const translationResult = await translator.translateText({
      text: message.content,
      targetLanguage,
      sourceLanguage: message.originalLanguage || 'auto'
    });

    // Save translation to database
    await DatabaseService.saveMessageTranslation(
      messageId,
      targetLanguage,
      translationResult.translatedText,
      Math.round((translationResult.confidence || 0) * 100)
    );

    // Update the message with translation
    await DatabaseService.updateMessageTranslation(
      messageId,
      translationResult.translatedText,
      targetLanguage
    );

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        translatedContent: translationResult.translatedText,
        targetLanguage,
        detectedLanguage: translationResult.detectedLanguage,
        confidence: translationResult.confidence,
        cached: false
      }
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to translate message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}