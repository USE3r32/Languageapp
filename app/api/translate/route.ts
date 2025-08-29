import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTranslator } from '@/lib/featherless';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, targetLanguage, sourceLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // Validate target language
    const translator = getTranslator();
    const supportedLanguages = translator.getSupportedLanguages();
    const isValidLanguage = supportedLanguages.some(lang => lang.code === targetLanguage);
    
    if (!isValidLanguage) {
      return NextResponse.json(
        { error: 'Unsupported target language' },
        { status: 400 }
      );
    }

    const result = await translator.translateText({
      text,
      targetLanguage,
      sourceLanguage
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { 
        error: 'Translation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const translator = getTranslator();
    const supportedLanguages = translator.getSupportedLanguages();
    
    return NextResponse.json({
      success: true,
      data: supportedLanguages
    });
  } catch (error) {
    console.error('Get languages API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get supported languages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}