import { getTranslationCache } from './translation-cache';

interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

export class FeatherlessTranslator {
  private apiKey: string;
  private baseUrl: string;
  private model = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private requestTimeout = 10000; // 10 seconds
  private cache = getTranslationCache();

  constructor(apiKey?: string) {
    // Use environment variable or provided key
    this.apiKey = apiKey || process.env.FEATHERLESS_API_KEY || '';
    this.baseUrl = process.env.TRANSLATE_KEY || 'https://api.featherless.ai/v1';

    if (!this.apiKey) {
      throw new Error('AI Translation API key is required. Set FEATHERLESS_API_KEY environment variable or provide it directly.');
    }

    console.log('🔧 AI Translation Service initialized with base URL:', this.baseUrl);
  }

  async translateText({
    text,
    targetLanguage,
    sourceLanguage = 'auto'
  }: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    console.log(`🌍 Starting translation: "${text.substring(0, 50)}..." → ${targetLanguage}`);

    try {
      // Validate input
      if (!text || !text.trim()) {
        throw new Error('Text is required for translation');
      }

      if (!targetLanguage) {
        throw new Error('Target language is required');
      }

      // Check cache first
      const cachedResult = await this.cache.get(text, sourceLanguage, targetLanguage);
      if (cachedResult) {
        const duration = Date.now() - startTime;
        console.log(`⚡ Cache hit: Translation completed in ${duration}ms`);
        return {
          translatedText: cachedResult.translatedText,
          detectedLanguage: cachedResult.sourceLanguage,
          confidence: cachedResult.confidence
        };
      }

      // Quick language detection to avoid unnecessary translation
      const detectedLang = await this.detectLanguage(text);
      if (detectedLang === targetLanguage) {
        console.log(`⚡ Skip translation: already in ${targetLanguage}`);
        const result = {
          translatedText: text,
          detectedLanguage: targetLanguage,
          confidence: 0.95
        };

        // Cache the result
        await this.cache.set(text, text, detectedLang, targetLanguage, 0.95);
        return result;
      }

      // Perform translation with retry logic
      const result = await this.translateWithRetry(text, targetLanguage, sourceLanguage, startTime);

      // Cache the successful translation
      if (result.translatedText && result.confidence && result.confidence > 0.5) {
        await this.cache.set(
          text,
          result.translatedText,
          result.detectedLanguage || sourceLanguage,
          targetLanguage,
          result.confidence
        );
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Translation failed after ${duration}ms:`, error);
      throw error;
    }
  }

  private async translateWithRetry(
    text: string,
    targetLanguage: string,
    sourceLanguage: string,
    startTime: number,
    attempt: number = 1
  ): Promise<TranslationResponse> {
    try {
      const response = await Promise.race([
        fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://translation-messenger.app',
            'X-Title': 'Translation Messenger'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: `You are a professional translator. Your task is to translate text accurately while preserving meaning, tone, and context.

IMPORTANT RULES:
1. Only return the translated text, nothing else
2. Preserve formatting (line breaks, punctuation)
3. Maintain the original tone and style
4. If the text is already in the target language, return it unchanged
5. For names, places, and proper nouns, keep them as-is unless they have standard translations
6. Do not add explanations, notes, or extra text

Target Language: ${this.getLanguageName(targetLanguage)}
Source Language: ${sourceLanguage === 'auto' ? 'Auto-detect' : this.getLanguageName(sourceLanguage)}`
              },
              {
                role: 'user',
                content: `Translate this text to ${this.getLanguageName(targetLanguage)}:\n\n${text}`
              }
            ],
            max_tokens: Math.min(2000, text.length * 3),
            temperature: 0.1,
            top_p: 0.9,
            stream: false
          })
        }),
        // Timeout promise
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Translation timeout')), this.requestTimeout)
        )
      ]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI Translation API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('No translation received from AI Translation API');
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Translation completed in ${duration}ms (attempt ${attempt})`);

      // Detect source language (simple heuristic)
      const detectedLanguage = await this.detectLanguage(text);

      return {
        translatedText,
        detectedLanguage,
        confidence: this.calculateConfidence(text, translatedText, targetLanguage)
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Translation attempt ${attempt} failed after ${duration}ms:`, error);

      // Retry logic
      if (attempt < this.maxRetries && this.shouldRetry(error)) {
        console.log(`🔄 Retrying translation (attempt ${attempt + 1}/${this.maxRetries})...`);
        await this.delay(this.retryDelay * attempt);
        return this.translateWithRetry(text, targetLanguage, sourceLanguage, startTime, attempt + 1);
      }

      // Final fallback - return original text
      console.warn(`⚠️ All translation attempts failed, returning original text`);
      return {
        translatedText: text,
        detectedLanguage: 'unknown',
        confidence: 0
      };
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.message?.includes('timeout')) return true;
    if (error.message?.includes('fetch')) return true;
    if (error.message?.includes('500')) return true;
    if (error.message?.includes('502')) return true;
    if (error.message?.includes('503')) return true;
    if (error.message?.includes('504')) return true;
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://translation-messenger.app',
          'X-Title': 'Translation Messenger'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are an advanced multilingual language detection expert with expertise in modern communication patterns.

CRITICAL INSTRUCTIONS:
- Respond with ONLY the ISO 639-1 language code (2 letters lowercase)
- NO explanations, NO additional text, NO punctuation
- Handle mixed languages by detecting the DOMINANT language (>60% of content)

LANGUAGE DETECTION CAPABILITIES:
- Standard languages: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, th, vi, nl, pl, tr, sv, da, no, fi, he, cs, hu, ro, bg, hr, sk, sl, et, lv, lt, mt, cy, ga, is, mk, sq, bs, sr, me, uk, be, kk, ky, uz, tg, mn, my, km, lo, si, ne, bn, ta, te, ml, kn, gu, pa, ur, fa, ps, am, ti, sw, zu, xh, af, ig, yo, ha, ff, wo, mg, rw, rn, ny, sn, st, tn, ts, ve, ss, nr, nso, lg, ak, tw, ee, gaa, dag, bm, dyu, mos, fon, lin, kg, lua, luo, nyn, teo, lgg, ach, laj, mhi, alz, toi, kdj, kbp, knc, fuv, bci, bib, gur, sus, men, tem, kri, vai, gom, byn, wal, sid, orm, som, aa, dv, mfe, bi, ho, ty, sm, to, fj, mi, haw, ch, mh, na, gil, tvl, niu, tkl, wls, yap, pon, kos, uli, trv, pwn, ami, tay, ckv, sdq, tao, sxr, xnb, xsy, tsu, ais, ckn, dru, ruq, bnn, pyu, tay, ssf, sxn, tay, xnb, xsy, tsu, ais, ckn, dru, ruq, bnn, pyu, tay, ssf, sxn

MODERN SLANG & INTERNET LANGUAGE HANDLING:
- Internet slang (LOL, ROFL, OMG, BRB, TTYL, YOLO, FOMO, etc.) → Detect base language context
- Code-switching (mixing languages) → Identify dominant language
- Transliterated text (Arabic/Hindi in Latin script) → Detect original language
- Emoji-heavy text → Focus on actual text content
- Abbreviations & acronyms → Consider surrounding context
- Gaming/Tech slang → Detect underlying language patterns
- Social media shorthand → Analyze linguistic structure
- Regional dialects & variants → Map to standard language codes
- Youth slang & generational terms → Detect base language
- Professional jargon → Focus on grammatical patterns

SPECIAL CASES:
- Numbers only → "en" (default)
- Emojis only → "en" (default)
- Mixed scripts → Detect primary script language
- Proper nouns only → "en" (default)
- URLs/emails → "en" (default)
- Code snippets → "en" (default)

EXAMPLES:
"Hello world" → en
"Hola mundo" → es
"Bonjour le monde" → fr
"LOL that's so funny bruh" → en
"jajaja que gracioso hermano" → es
"mdr c'est trop drôle mec" → fr
"😂😂😂 so true bestie" → en
"Salam alaikum habibi" → ar
"Namaste dost kaise ho" → hi
"Konnichiwa tomodachi" → ja`
            },
            {
              role: 'user',
              content: `Detect the language of this text: "${text}"`
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        return 'en'; // Default fallback
      }

      const data = await response.json();
      const detectedLang = data.choices?.[0]?.message?.content?.trim()?.toLowerCase();
      
      const validLangCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
      return validLangCodes.includes(detectedLang) ? detectedLang : 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  async batchTranslate(
    texts: string[], 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<TranslationResponse[]> {
    const translations = await Promise.allSettled(
      texts.map(text => this.translateText({ text, targetLanguage, sourceLanguage }))
    );

    return translations.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Translation failed for text ${index}:`, result.reason);
        return {
          translatedText: texts[index],
          detectedLanguage: 'unknown',
          confidence: 0
        };
      }
    });
  }

  // Helper methods
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
    };
    return languages[code] || code;
  }

  private isLikelyInLanguage(text: string, targetLanguage: string): boolean {
    // Simple heuristic to check if text might already be in target language
    if (targetLanguage === 'en') {
      // Check for common English words
      const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const words = text.toLowerCase().split(/\s+/);
      const englishWordCount = words.filter(word => englishWords.includes(word)).length;
      return englishWordCount > words.length * 0.3;
    }
    
    // For other languages, we'll let the API handle it
    return false;
  }

  private calculateConfidence(originalText: string, translatedText: string, _targetLanguage: string): number {
    // Simple confidence calculation based on text differences
    if (originalText === translatedText) {
      return 0.95; // High confidence if no translation needed
    }
    
    const lengthRatio = translatedText.length / originalText.length;
    if (lengthRatio < 0.3 || lengthRatio > 3) {
      return 0.5; // Lower confidence for extreme length differences
    }
    
    return 0.85; // Default confidence for successful translations
  }

  // Get supported languages
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    ];
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.translateText({
        text: 'Hello',
        targetLanguage: 'es'
      });
      return (result.confidence || 0) > 0;
    } catch (error) {
      console.error('AI Translation connection test failed:', error);
      return false;
    }
  }
}

// Optimized singleton instance with connection pooling
let translatorInstance: FeatherlessTranslator | null = null;

export const getTranslator = (): FeatherlessTranslator => {
  if (!translatorInstance) {
    // Try multiple API key sources
    const apiKey = process.env.FEATHERLESS_API_KEY ||
                   process.env.NEXT_PUBLIC_FEATHERLESS_API_KEY ||
                   process.env.TRANSLATE_API_KEY;

    if (!apiKey) {
      console.error('❌ No AI Translation API key found. Please set one of:');
      console.error('   - FEATHERLESS_API_KEY');
      console.error('   - NEXT_PUBLIC_FEATHERLESS_API_KEY');
      console.error('   - TRANSLATE_API_KEY');
      throw new Error('AI Translation API key is required for translation');
    }

    console.log('🚀 Initializing AI Translation Service...');
    translatorInstance = new FeatherlessTranslator(apiKey);
  }
  return translatorInstance;
};

// Fast translation function for real-time messaging
export async function translateMessage(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<TranslationResponse> {
  const startTime = Date.now();

  try {
    const translator = getTranslator();
    const result = await translator.translateText({
      text,
      targetLanguage,
      sourceLanguage
    });

    const duration = Date.now() - startTime;
    console.log(`⚡ Message translated in ${duration}ms: "${text.substring(0, 30)}..." → "${result.translatedText.substring(0, 30)}..."`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Translation failed after ${duration}ms:`, error);

    // Return original text as fallback
    return {
      translatedText: text,
      detectedLanguage: sourceLanguage,
      confidence: 0
    };
  }
}

export const translator = getTranslator();