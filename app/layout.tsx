import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Translation Messenger',
  description: 'Professional real-time messaging with instant translation',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Translation Messenger'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00ff00'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      dynamic
    >
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#00ff00" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </head>
        <body className={inter.className}>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}