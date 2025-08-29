'use client';

interface TranslationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  targetLanguage: string;
  onLanguageChange: (language: string) => void;
}

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

export default function TranslationToggle({ 
  enabled, 
  onToggle, 
  targetLanguage, 
  onLanguageChange 
}: TranslationToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-neon-green' : 'bg-gray-300'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`} />
          </div>
          <span className="text-sm font-medium text-black">
            Translation
          </span>
        </label>
      </div>

      {enabled && (
        <select
          value={targetLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:border-neon-green"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}