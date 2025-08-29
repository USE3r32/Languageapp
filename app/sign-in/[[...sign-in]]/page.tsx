'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue to Translation Messenger
          </p>
        </div>
        
        <SignIn
          appearance={{
            elements: {
              card: "shadow-lg border border-gray-200 rounded-lg",
              headerTitle: "text-black font-semibold",
              headerSubtitle: "text-gray-600",
              formButtonPrimary: "bg-green-400 hover:bg-green-500 text-black font-semibold",
              formFieldInput: "border-gray-300 focus:border-green-400 focus:ring-green-400",
              footerActionLink: "text-green-600 hover:text-green-700",
              socialButtonsBlockButton: "border-gray-300 hover:bg-gray-50",
              socialButtonsBlockButtonText: "text-gray-700",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500",
            },
            variables: {
              colorPrimary: "#00ff00",
              colorBackground: "#ffffff",
              colorText: "#000000",
              borderRadius: "0.5rem",
            }
          }}
          redirectUrl="/chat"
        />
      </div>
    </div>
  );
}