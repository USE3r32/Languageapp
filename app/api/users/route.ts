import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name } = await request.json();

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(existingUser[0]);
    }

    // Create new user
    const newUser = await db.insert(users).values({
      clerkId: userId,
      email,
      firstName: name || '',
      lastName: '',
    }).returning();

    return NextResponse.json(newUser[0]);
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}