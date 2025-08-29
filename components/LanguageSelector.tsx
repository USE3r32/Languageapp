'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Check, Loader2 } from 'lucide-react';

const LANGUAGES = [
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
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
];

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export default function LanguageSelector({ className = '', showLabel = true }: LanguageSelectorProps) {
  const { user } = useUser();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const response = await fetch('/api/users/language');
        if (response.ok) {
          const data = await response.json();
          setSelectedLanguage(data.preferredLanguage || 'en');
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    if (user) {
      loadLanguagePreference();
    }
  }, [user]);

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setLoading(true);
    setSaved(false);

    try {
      const response = await fetch('/api/users/language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredLanguage: languageCode,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        console.error('Failed to save language preference');
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLanguageName = LANGUAGES.find(lang => lang.code === selectedLanguage)?.name || 'English';

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Translation Language
        </Label>
      )}
      
      <div className="flex items-center gap-2">
        <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={loading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {selectedLanguageName}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  {language.name}
                  {language.code === selectedLanguage && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
        
        {saved && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        Messages will be automatically translated to this language
      </p>
    </div>
  );
}
