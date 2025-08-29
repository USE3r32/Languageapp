'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Users, MessageCircle, Search, User, CheckCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SearchableUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  isOnline: boolean | null;
  lastSeen?: Date | null;
}

interface NewChatDialogProps {
  onCreateChat: (data: { name?: string; isGroup: boolean; memberIds: string[] }) => void;
  trigger?: React.ReactNode;
}

export default function NewChatDialog({ onCreateChat, trigger }: NewChatDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [chatName, setChatName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<SearchableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch all users when dialog opens
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/search?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.data || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users with debouncing
  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      fetchAllUsers();
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.data || []);
      } else {
        console.error('Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [fetchAllUsers]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      fetchAllUsers();
    }
  }, [open, fetchAllUsers]);

  const getDisplayName = (user: SearchableUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email.split('@')[0];
  };

  const getInitials = (user: SearchableUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.lastName) return user.lastName[0].toUpperCase();
    return user.email[0].toUpperCase();
  };

  const handleCreateDirectChat = (userId: string) => {
    onCreateChat({
      isGroup: false,
      memberIds: [userId]
    });
    setOpen(false);
    resetForm();
  };

  const handleCreateGroupChat = () => {
    if (selectedMembers.length === 0) return;
    
    onCreateChat({
      name: chatName || `Group with ${selectedMembers.length} members`,
      isGroup: true,
      memberIds: selectedMembers
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setChatName('');
    setSelectedMembers([]);
    setSearchQuery('');
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-green-400 hover:bg-green-500 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-black font-semibold">Start New Conversation</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a direct message or group chat with your team members
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Direct Message</span>
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Group Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Select Team Member</CardTitle>
                <CardDescription>
                  Choose someone to start a direct conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-gray-300 focus:border-green-400 focus:ring-green-400"
                  />
                  
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {loading || searchLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-gray-600">
                            {searchLoading ? 'Searching...' : 'Loading users...'}
                          </span>
                        </div>
                      ) : availableUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <User className="w-12 h-12 text-gray-300 mb-2" />
                          <p className="text-gray-600 font-medium">No users found</p>
                          <p className="text-sm text-gray-500">
                            {searchQuery ? 'Try a different search term' : 'No users available'}
                          </p>
                        </div>
                      ) : (
                        availableUsers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={member.imageUrl || undefined} />
                                  <AvatarFallback className="bg-gray-300 text-gray-600">
                                    {getInitials(member)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${
                                  member.isOnline ? 'bg-green-400' : 'bg-gray-400'
                                } rounded-full border-2 border-white`} />
                              </div>
                              <div>
                                <p className="font-medium text-black">{getDisplayName(member)}</p>
                                <p className="text-sm text-gray-600">{member.email}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleCreateDirectChat(member.id)}
                              size="sm"
                              className="bg-green-400 hover:bg-green-500 text-black"
                            >
                              Message
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create Group Chat</CardTitle>
                <CardDescription>
                  Add multiple team members to start a group conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="groupName" className="text-sm font-medium text-black">
                    Group Name (Optional)
                  </Label>
                  <Input
                    id="groupName"
                    placeholder="Enter group name..."
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    className="mt-1 border-gray-300 focus:border-green-400 focus:ring-green-400"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-black">
                    Select Members
                  </Label>
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      {selectedMembers.map((memberId) => {
                        const member = availableUsers.find(u => u.id === memberId);
                        return member ? (
                          <Badge
                            key={memberId}
                            variant="secondary"
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            {getDisplayName(member)}
                            <button
                              onClick={() => toggleMember(memberId)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-gray-300 focus:border-green-400 focus:ring-green-400"
                  />
                  
                  <ScrollArea className="h-[150px] mt-3">
                    <div className="space-y-2">
                      {availableUsers.map((member) => (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                            selectedMembers.includes(member.id)
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleMember(member.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-600">
                                  {getInitials(member)}
                                </span>
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${
                                member.isOnline ? 'bg-green-400' : 'bg-gray-400'
                              } rounded-full border border-white`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-black">{getDisplayName(member)}</p>
                              <p className="text-xs text-gray-600">{member.email}</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded border-2 ${
                            selectedMembers.includes(member.id)
                              ? 'bg-green-400 border-green-400'
                              : 'border-gray-300'
                          }`}>
                            {selectedMembers.includes(member.id) && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Button
                  onClick={handleCreateGroupChat}
                  disabled={selectedMembers.length === 0}
                  className="w-full bg-green-400 hover:bg-green-500 text-black font-semibold disabled:opacity-50"
                >
                  Create Group Chat ({selectedMembers.length} members)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}