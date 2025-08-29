import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/user-profile(.*)',
  '/api/conversations(.*)',
  '/api/messages(.*)',
  '/api/users(.*)',
  '/api/translate(.*)',
  '/api/push(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow health check endpoint without authentication
  if (req.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    
    if (!userId) {
      // Redirect to sign-in for protected routes
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};