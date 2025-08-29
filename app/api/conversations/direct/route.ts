import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/database';

export const runtime = 'nodejs';

// POST /api/conversations/direct - Find or create direct conversation by email
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const conversation = await DatabaseService.findOrCreateDirectConversation(
      userId, 
      email.trim().toLowerCase()
    );

    return NextResponse.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Direct conversation error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Target user not found') {
        return NextResponse.json(
          { error: 'User with this email not found. They need to sign up first.' },
          { status: 404 }
        );
      }
      if (error.message === 'Cannot message yourself') {
        return NextResponse.json(
          { error: 'You cannot message yourself' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
