'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClientClerkProviderProps {
  children: ReactNode;
}

export default function ClientClerkProvider({ children }: ClientClerkProviderProps) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#00ff00',
          colorBackground: '#ffffff',
          colorText: '#000000',
          colorInputBackground: '#ffffff',
          colorInputText: '#000000',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-green-400 hover:bg-green-500 text-black',
          card: 'shadow-lg border border-gray-200',
          headerTitle: 'text-black',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
          socialButtonsBlockButtonText: 'text-gray-700',
          formFieldInput: 'border-gray-300 focus:border-green-400 focus:ring-green-400',
          footerActionLink: 'text-green-600 hover:text-green-700',
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
