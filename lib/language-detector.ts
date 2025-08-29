// Language Detection Service - COMPETITIVE ADVANTAGE
// Automatically detect message language for seamless translation

export interface LanguageDetection {
  language: string;
  confidence: number;
  languageName: string;
  flag: string;
}

export class LanguageDetector {
  private static languageMap: { [key: string]: { name: string; flag: string } } = {
    'en': { name: 'English', flag: '🇺🇸' },
    'es': { name: 'Spanish', flag: '🇪🇸' },
    'fr': { name: 'French', flag: '🇫🇷' },
    'de': { name: 'German', flag: '🇩🇪' },
    'it': { name: 'Italian', flag: '🇮🇹' },
    'pt': { name: 'Portuguese', flag: '🇵🇹' },
    'ru': { name: 'Russian', flag: '🇷🇺' },
    'ja': { name: 'Japanese', flag: '🇯🇵' },
    'ko': { name: 'Korean', flag: '🇰🇷' },
    'zh': { name: 'Chinese', flag: '🇨🇳' },
    'ar': { name: 'Arabic', flag: '🇸🇦' },
    'hi': { name: 'Hindi', flag: '🇮🇳' },
    'th': { name: 'Thai', flag: '🇹🇭' },
    'vi': { name: 'Vietnamese', flag: '🇻🇳' },
    'nl': { name: 'Dutch', flag: '🇳🇱' },
    'sv': { name: 'Swedish', flag: '🇸🇪' },
    'no': { name: 'Norwegian', flag: '🇳🇴' },
    'da': { name: 'Danish', flag: '🇩🇰' },
    'fi': { name: 'Finnish', flag: '🇫🇮' },
    'pl': { name: 'Polish', flag: '🇵🇱' },
  };

  // Simple pattern-based language detection
  // In production, you'd use a proper language detection API
  static detectLanguage(text: string): LanguageDetection {
    const cleanText = text.toLowerCase().trim();
    
    // Spanish patterns
    if (this.hasSpanishPatterns(cleanText)) {
      return {
        language: 'es',
        confidence: 0.85,
        languageName: this.languageMap['es'].name,
        flag: this.languageMap['es'].flag
      };
    }
    
    // French patterns
    if (this.hasFrenchPatterns(cleanText)) {
      return {
        language: 'fr',
        confidence: 0.85,
        languageName: this.languageMap['fr'].name,
        flag: this.languageMap['fr'].flag
      };
    }
    
    // German patterns
    if (this.hasGermanPatterns(cleanText)) {
      return {
        language: 'de',
        confidence: 0.85,
        languageName: this.languageMap['de'].name,
        flag: this.languageMap['de'].flag
      };
    }
    
    // Italian patterns
    if (this.hasItalianPatterns(cleanText)) {
      return {
        language: 'it',
        confidence: 0.85,
        languageName: this.languageMap['it'].name,
        flag: this.languageMap['it'].flag
      };
    }
    
    // Default to English
    return {
      language: 'en',
      confidence: 0.9,
      languageName: this.languageMap['en'].name,
      flag: this.languageMap['en'].flag
    };
  }

  private static hasSpanishPatterns(text: string): boolean {
    const spanishWords = ['hola', 'como', 'está', 'que', 'muy', 'bien', 'gracias', 'por', 'favor', 'sí', 'no', 'donde', 'cuando', 'porque'];
    const spanishChars = /[ñáéíóúü]/;
    
    const wordMatches = spanishWords.filter(word => text.includes(word)).length;
    const hasSpanishChars = spanishChars.test(text);
    
    return wordMatches >= 1 || hasSpanishChars;
  }

  private static hasFrenchPatterns(text: string): boolean {
    const frenchWords = ['bonjour', 'comment', 'vous', 'allez', 'très', 'bien', 'merci', 'oui', 'non', 'où', 'quand', 'pourquoi', 'avec'];
    const frenchChars = /[àâäéèêëïîôöùûüÿç]/;
    
    const wordMatches = frenchWords.filter(word => text.includes(word)).length;
    const hasFrenchChars = frenchChars.test(text);
    
    return wordMatches >= 1 || hasFrenchChars;
  }

  private static hasGermanPatterns(text: string): boolean {
    const germanWords = ['hallo', 'wie', 'geht', 'ihnen', 'sehr', 'gut', 'danke', 'bitte', 'ja', 'nein', 'wo', 'wann', 'warum', 'mit'];
    const germanChars = /[äöüß]/;
    
    const wordMatches = germanWords.filter(word => text.includes(word)).length;
    const hasGermanChars = germanChars.test(text);
    
    return wordMatches >= 1 || hasGermanChars;
  }

  private static hasItalianPatterns(text: string): boolean {
    const italianWords = ['ciao', 'come', 'stai', 'molto', 'bene', 'grazie', 'prego', 'sì', 'no', 'dove', 'quando', 'perché', 'con'];
    const italianChars = /[àèéìíîòóù]/;
    
    const wordMatches = italianWords.filter(word => text.includes(word)).length;
    const hasItalianChars = italianChars.test(text);
    
    return wordMatches >= 1 || hasItalianChars;
  }

  // Get language info by code
  static getLanguageInfo(code: string) {
    return this.languageMap[code] || this.languageMap['en'];
  }

  // Get all supported languages
  static getSupportedLanguages() {
    return Object.entries(this.languageMap).map(([code, info]) => ({
      code,
      name: info.name,
      flag: info.flag
    }));
  }
}
