'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import NewChatDialog from './NewChatDialog';
import DirectMessageDialog from './DirectMessageDialog';
import { Plus, Search, MessageCircle, Users, Mail } from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  isGroup: boolean;
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversation: string | null;
}

export default function ConversationList({ onSelectConversation, selectedConversation }: ConversationListProps) {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter(conversation =>
    conversation.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    // This will be handled by the NewChatDialog component
  };

  const handleCreateChat = async (data: { name?: string; isGroup: boolean; memberIds: string[] }) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh conversations list
        fetchConversations();
        // Select the new conversation
        onSelectConversation(result.data.id);
      } else {
        console.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 border-gray-300 focus:border-green-400 focus:ring-green-400"
          />
        </div>
      </div>

      {/* New Chat Buttons */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        {/* Direct Message Button - MESSENGER STYLE */}
        <Button
          onClick={() => setShowDirectMessageDialog(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          <Mail className="w-4 h-4 mr-2" />
          Message Someone
        </Button>

        {/* Group Chat Button */}
        <NewChatDialog
          onCreateChat={handleCreateChat}
          trigger={
            <Button className="w-full bg-green-400 hover:bg-green-500 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              New Group Chat
            </Button>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            <MessageCircle className="w-4 h-4 mr-1" />
            Direct
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            <Users className="w-4 h-4 mr-1" />
            Groups
          </Button>
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-200">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-gray-100 border-r-2 border-green-400' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {conversation.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  {conversation.isGroup && (
                    <Badge className="absolute -bottom-1 -right-1 w-4 h-4 p-0 bg-green-400 hover:bg-green-400 text-black rounded-full flex items-center justify-center">
                      <Users className="w-2 h-2" />
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-black truncate">
                      {conversation.name || 'Unknown Chat'}
                    </h3>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conversation.lastMessageTime}
                      </span>
                    )}
                  </div>
                  
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {filteredConversations.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No conversations found</p>
                <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No conversations yet</p>
                <p className="text-sm text-gray-500 mb-4">Start connecting with your team</p>
                <NewChatDialog 
                  onCreateChat={handleCreateChat}
                  trigger={
                    <Button className="bg-green-400 hover:bg-green-500 text-black font-semibold">
                      <Plus className="w-4 h-4 mr-2" />
                      Start Your First Chat
                    </Button>
                  }
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Direct Message Dialog */}
      <DirectMessageDialog
        open={showDirectMessageDialog}
        onOpenChange={setShowDirectMessageDialog}
        onConversationCreated={(conversationId) => {
          onSelectConversation(conversationId);
          fetchConversations(); // Refresh the conversation list
        }}
      />
    </div>
  );
}