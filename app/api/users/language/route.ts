import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/database';

export const runtime = 'nodejs';

// GET /api/users/language - Get user's language preference
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await DatabaseService.getUserByClerkId(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      preferredLanguage: user.preferredLanguage || 'en'
    });
  } catch (error) {
    console.error('Get language preference error:', error);
    return NextResponse.json(
      { error: 'Failed to get language preference' },
      { status: 500 }
    );
  }
}

// POST /api/users/language - Update user's language preference
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferredLanguage } = await request.json();

    if (!preferredLanguage || typeof preferredLanguage !== 'string') {
      return NextResponse.json(
        { error: 'Valid language code is required' },
        { status: 400 }
      );
    }

    // Validate language code (basic validation)
    const validLanguages = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 
      'ar', 'hi', 'th', 'vi', 'nl', 'sv', 'no', 'da', 'fi', 'pl'
    ];

    if (!validLanguages.includes(preferredLanguage)) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }

    const updatedUser = await DatabaseService.updateUserLanguage(userId, preferredLanguage);

    return NextResponse.json({
      success: true,
      preferredLanguage: updatedUser.preferredLanguage
    });
  } catch (error) {
    console.error('Update language preference error:', error);
    return NextResponse.json(
      { error: 'Failed to update language preference' },
      { status: 500 }
    );
  }
}
