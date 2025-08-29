'use client';

import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import MessengerInterface from '@/components/MessengerInterface';
import ConversationList from '@/components/ConversationList';
import SettingsDialog from '@/components/SettingsDialog';
import DirectMessageDialog from '@/components/DirectMessageDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Settings, Users, MessageCircle, Mail } from 'lucide-react';

export default function ChatPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(true);
  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);

  // Sync user with database on mount
  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        try {
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      }
    };

    if (isLoaded && isSignedIn && user) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          {selectedConversation && (
            <button
              onClick={() => {
                setSelectedConversation(null);
                setShowConversations(true);
              }}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full md:hidden"
            >
              ←
            </button>
          )}
          <h1 className="text-xl font-semibold text-black">
            {selectedConversation ? 'Chat' : 'Messages'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Settings Button */}
          <SettingsDialog 
            trigger={
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Settings className="w-4 h-4" />
              </Button>
            }
          />

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* User Button with Dashboard */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
                userButtonPopoverCard: "shadow-lg border border-gray-200",
                userButtonPopoverActionButton: "hover:bg-gray-50",
                userButtonPopoverActionButtonText: "text-gray-700",
                userButtonPopoverActionButtonIcon: "text-gray-500",
              },
              variables: {
                colorPrimary: "#00ff00",
                colorBackground: "#ffffff",
                colorText: "#000000",
              }
            }}
            userProfileMode="navigation"
            userProfileUrl="/user-profile"
            afterSignOutUrl="/"
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label="Dashboard"
                labelIcon={<Settings className="w-4 h-4" />} 
                onClick={() => window.open('https://dashboard.clerk.com', '_blank')}
              />
              <UserButton.Action
                label="Settings"
                labelIcon={<Settings className="w-4 h-4" />}
                onClick={() => {
                  // This will be handled by the SettingsDialog component
                }}
              />
              <UserButton.Action
                label="Manage Team"
                labelIcon={<Users className="w-4 h-4" />}
                onClick={() => {
                  // TODO: Implement team management
                  console.log('Manage team clicked');
                }}
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>

      {/* Main Content - MESSENGER STYLE */}
      <div className="flex-1 flex overflow-hidden bg-gray-100">
        {/* Conversation List - MESSENGER SIDEBAR */}
        <div className={`${
          showConversations ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 border-r border-gray-300 bg-white`}>
          <ConversationList
            onSelectConversation={(id) => {
              setSelectedConversation(id);
              setShowConversations(false);
            }}
            selectedConversation={selectedConversation}
          />
        </div>

        {/* Chat Interface - MESSENGER CHAT */}
        <div className={`${
          !showConversations ? 'flex' : 'hidden'
        } md:flex flex-col flex-1 bg-white`}>
          {selectedConversation ? (
            <MessengerInterface
              conversationId={selectedConversation}
              conversationName="Chat"
              onBack={() => {
                setSelectedConversation(null);
                setShowConversations(true);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center px-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Select a conversation
                </h2>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  Choose a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}