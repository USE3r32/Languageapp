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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Bell, Globe, Palette } from 'lucide-react';

interface SettingsDialogProps {
  trigger?: React.ReactNode;
}

export default function SettingsDialog({ trigger }: SettingsDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  // Simple settings state
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [showOriginal, setShowOriginal] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveSettings = () => {
    console.log('💾 Settings saved');
    setOpen(false);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your messaging experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Translation Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Translation
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Auto-Translate Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically translate incoming messages
                </p>
              </div>
              <Switch
                checked={autoTranslate}
                onCheckedChange={setAutoTranslate}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="target-language" className="text-sm font-medium">
                Your Language
              </Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Click to See Original</Label>
                <p className="text-sm text-muted-foreground">
                  Click messages to toggle between original and translated
                </p>
              </div>
              <Switch
                checked={showOriginal}
                onCheckedChange={setShowOriginal}
              />
            </div>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">New Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified for new messages
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound for notifications
                </p>
              </div>
              <Switch
                checked={sounds}
                onCheckedChange={setSounds}
              />
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
