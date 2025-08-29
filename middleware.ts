import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
  try {
    // Allow health check endpoint without authentication
    if (req.nextUrl.pathname === '/api/health') {
      return NextResponse.next();
    }

    // Get auth context - this must be done within the middleware context
    const authResult = await auth();
    const { userId } = authResult;
    
    // Protect routes that require authentication
    if (isProtectedRoute(req)) {
      if (!userId) {
        // Redirect to sign-in for protected routes
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Fallback to allow the request to continue
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};