'use client';

import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/chat');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-black mb-4 tracking-tight">
              Translation
              <span className="block text-green-400">Messenger</span>
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Professional real-time messaging with instant translation capabilities
            </p>
          </div>
          
          <div className="space-y-4 mb-12">
            <SignInButton mode="modal">
              <Button variant="neon" size="lg" className="w-full">
                Sign In
              </Button>
            </SignInButton>
            
            <SignUpButton mode="modal">
              <Button variant="outline" size="lg" className="w-full">
                Create Account
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="px-6 py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-black mb-8 text-center">
            Professional Features
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="font-semibold text-black mb-1">Real-time Messaging</h3>
                <p className="text-gray-600 text-sm">
                  Instant message delivery with live typing indicators
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="font-semibold text-black mb-1">AI Translation</h3>
                <p className="text-gray-600 text-sm">
                  Powered by advanced AI for accurate translations
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="font-semibold text-black mb-1">Multi-language Support</h3>
                <p className="text-gray-600 text-sm">
                  Support for 12+ languages with automatic detection
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="font-semibold text-black mb-1">Secure & Private</h3>
                <p className="text-gray-600 text-sm">
                  Enterprise-grade security with end-to-end encryption
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="font-semibold text-black mb-1">Mobile Optimized</h3>
                <p className="text-gray-600 text-sm">
                  Progressive Web App with offline capabilities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-6 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm text-gray-500">
            Professional messaging solution for global teams
          </p>
        </div>
      </div>
    </div>
  );
}