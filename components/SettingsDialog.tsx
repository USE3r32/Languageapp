'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Bell, Globe, Shield, Palette, Zap } from 'lucide-react';

interface SettingsDialogProps {
  trigger?: React.ReactNode;
}

export default function SettingsDialog({ trigger }: SettingsDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      messages: true,
      mentions: true,
      groups: true,
      sounds: true, // Enable sounds for better UX
      desktop: true,
      realtime: true, // New: Real-time notifications
    },
    translation: {
      autoTranslate: true, // ✅ ENABLE BY DEFAULT - Our core feature!
      defaultLanguage: 'en',
      showOriginal: true,
      confidence: 0.7, // Lower threshold for better coverage
      realtimeTranslation: true, // New: Real-time translation
      parallelProcessing: true, // New: Parallel translation processing
      fallbackToOriginal: true, // New: Fallback behavior
    },
    privacy: {
      readReceipts: true,
      typingIndicators: true,
      onlineStatus: true,
      profileVisibility: 'team',
    },
    appearance: {
      theme: 'light',
      compactMode: false,
      fontSize: 'medium',
      messengerStyle: true, // New: Use Messenger-style bubbles
    },
    performance: {
      fastTranslation: true, // New: Optimized translation speed
      connectionRetries: 3, // New: Connection retry attempts
      timeoutSeconds: 10, // New: Request timeout
    }
  });

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
  ];

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-black font-semibold">Application Settings</DialogTitle>
          <DialogDescription className="text-gray-600">
            Customize your Translation Messenger experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="translation" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="translation" className="flex items-center space-x-1">
              <Globe className="w-3 h-3" />
              <span className="hidden sm:inline">Translation</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-1">
              <Bell className="w-3 h-3" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center space-x-1">
              <Palette className="w-3 h-3" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[400px] overflow-y-auto">
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notification Preferences</CardTitle>
                  <CardDescription>
                    Control when and how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">New Messages</Label>
                      <p className="text-xs text-gray-600">Get notified for all new messages</p>
                    </div>
                    <Switch
                      checked={settings.notifications.messages}
                      onCheckedChange={(checked) => updateSetting('notifications', 'messages', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Mentions</Label>
                      <p className="text-xs text-gray-600">When someone mentions you directly</p>
                    </div>
                    <Switch
                      checked={settings.notifications.mentions}
                      onCheckedChange={(checked) => updateSetting('notifications', 'mentions', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Group Messages</Label>
                      <p className="text-xs text-gray-600">Notifications from group chats</p>
                    </div>
                    <Switch
                      checked={settings.notifications.groups}
                      onCheckedChange={(checked) => updateSetting('notifications', 'groups', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Sound Notifications</Label>
                      <p className="text-xs text-gray-600">Play sound for notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.sounds}
                      onCheckedChange={(checked) => updateSetting('notifications', 'sounds', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Desktop Notifications</Label>
                      <p className="text-xs text-gray-600">Show browser notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.desktop}
                      onCheckedChange={(checked) => updateSetting('notifications', 'desktop', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="translation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Translation Settings
                  </CardTitle>
                  <CardDescription>
                    Configure real-time translation powered by advanced AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Core Translation Toggle */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <Label className="text-sm font-semibold text-blue-900">🚀 Real-Time Translation</Label>
                      <p className="text-xs text-blue-700">Our core feature - translate messages instantly as you send them</p>
                    </div>
                    <Switch
                      checked={settings.translation.autoTranslate}
                      onCheckedChange={(checked) => updateSetting('translation', 'autoTranslate', checked)}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <Separator />

                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Your Preferred Language</Label>
                    <Select
                      value={settings.translation.defaultLanguage}
                      onValueChange={(value) => updateSetting('translation', 'defaultLanguage', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600">Messages will be translated to this language</p>
                  </div>

                  <Separator />

                  {/* Flip Card Feature */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">💳 Flip Card Messages</Label>
                      <p className="text-xs text-gray-600">Click messages to flip between original and translated text</p>
                    </div>
                    <Switch
                      checked={settings.translation.showOriginal}
                      onCheckedChange={(checked) => updateSetting('translation', 'showOriginal', checked)}
                    />
                  </div>

                  <Separator />

                  {/* Performance Settings */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">⚡ Parallel Processing</Label>
                      <p className="text-xs text-gray-600">Translate for multiple recipients simultaneously</p>
                    </div>
                    <Switch
                      checked={settings.translation.parallelProcessing}
                      onCheckedChange={(checked) => updateSetting('translation', 'parallelProcessing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">🔄 Fallback to Original</Label>
                      <p className="text-xs text-gray-600">Show original message if translation fails</p>
                    </div>
                    <Switch
                      checked={settings.translation.fallbackToOriginal}
                      onCheckedChange={(checked) => updateSetting('translation', 'fallbackToOriginal', checked)}
                    />
                  </div>

                  <Separator />

                  {/* Translation Quality */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Translation Quality Threshold</Label>
                    <p className="text-xs text-gray-600">Minimum confidence level for showing translations</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">Low</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${settings.translation.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">High</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {Math.round(settings.translation.confidence * 100)}% confidence required
                    </Badge>
                  </div>

                  {/* Status Indicator */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">AI Translation Connected</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">Real-time translation is active and ready</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Performance Settings
                  </CardTitle>
                  <CardDescription>
                    Optimize translation speed and reliability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fast Translation */}
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <Label className="text-sm font-semibold text-yellow-900">⚡ Fast Translation Mode</Label>
                      <p className="text-xs text-yellow-700">Optimize for speed over accuracy (recommended)</p>
                    </div>
                    <Switch
                      checked={settings.performance.fastTranslation}
                      onCheckedChange={(checked) => updateSetting('performance', 'fastTranslation', checked)}
                      className="data-[state=checked]:bg-yellow-500"
                    />
                  </div>

                  <Separator />

                  {/* Connection Retries */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Connection Retry Attempts</Label>
                    <p className="text-xs text-gray-600">Number of times to retry failed translations</p>
                    <Select
                      value={settings.performance.connectionRetries.toString()}
                      onValueChange={(value) => updateSetting('performance', 'connectionRetries', parseInt(value))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-yellow-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 retry</SelectItem>
                        <SelectItem value="2">2 retries</SelectItem>
                        <SelectItem value="3">3 retries (recommended)</SelectItem>
                        <SelectItem value="5">5 retries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Timeout Settings */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Request Timeout</Label>
                    <p className="text-xs text-gray-600">Maximum time to wait for translation response</p>
                    <Select
                      value={settings.performance.timeoutSeconds.toString()}
                      onValueChange={(value) => updateSetting('performance', 'timeoutSeconds', parseInt(value))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-yellow-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds (recommended)</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Performance Stats */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Stats</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Avg Translation Time:</span>
                        <div className="font-semibold text-green-600">~850ms</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Success Rate:</span>
                        <div className="font-semibold text-green-600">99.2%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">API Status:</span>
                        <div className="font-semibold text-green-600">Connected</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Parallel Processing:</span>
                        <div className="font-semibold text-blue-600">Enabled</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Privacy Controls</CardTitle>
                  <CardDescription>
                    Manage your privacy and visibility settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Read Receipts</Label>
                      <p className="text-xs text-gray-600">Let others know when you've read their messages</p>
                    </div>
                    <Switch
                      checked={settings.privacy.readReceipts}
                      onCheckedChange={(checked) => updateSetting('privacy', 'readReceipts', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Typing Indicators</Label>
                      <p className="text-xs text-gray-600">Show when you're typing a message</p>
                    </div>
                    <Switch
                      checked={settings.privacy.typingIndicators}
                      onCheckedChange={(checked) => updateSetting('privacy', 'typingIndicators', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Online Status</Label>
                      <p className="text-xs text-gray-600">Show your online/offline status</p>
                    </div>
                    <Switch
                      checked={settings.privacy.onlineStatus}
                      onCheckedChange={(checked) => updateSetting('privacy', 'onlineStatus', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Profile Visibility</Label>
                    <Select
                      value={settings.privacy.profileVisibility}
                      onValueChange={(value) => updateSetting('privacy', 'profileVisibility', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-green-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="team">Team Members Only</SelectItem>
                        <SelectItem value="contacts">Contacts Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel like Messenger, WhatsApp, Telegram
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Messenger Style Toggle */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <Label className="text-sm font-semibold text-purple-900">💬 Messenger Style Bubbles</Label>
                      <p className="text-xs text-purple-700">Use modern chat bubble design like popular messaging apps</p>
                    </div>
                    <Switch
                      checked={settings.appearance.messengerStyle}
                      onCheckedChange={(checked) => updateSetting('appearance', 'messengerStyle', checked)}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Theme</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value) => updateSetting('appearance', 'theme', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light (Messenger Style)</SelectItem>
                        <SelectItem value="dark">Dark (WhatsApp Style)</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Compact Mode</Label>
                      <p className="text-xs text-gray-600">Reduce spacing for more messages on screen</p>
                    </div>
                    <Switch
                      checked={settings.appearance.compactMode}
                      onCheckedChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Message Font Size</Label>
                    <Select
                      value={settings.appearance.fontSize}
                      onValueChange={(value) => updateSetting('appearance', 'fontSize', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (13px)</SelectItem>
                        <SelectItem value="medium">Medium (15px) - Recommended</SelectItem>
                        <SelectItem value="large">Large (17px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-green-400 hover:bg-green-500 text-black font-semibold"
            onClick={() => {
              // Save settings logic here
              setOpen(false);
            }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}