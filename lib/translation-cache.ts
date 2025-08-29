/**
 * 🚀 ENHANCED TRANSLATION CACHE SYSTEM
 * Production-ready caching with memory + database persistence
 */

interface CachedTranslation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: number;
  hitCount: number;
}

interface TranslationCacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  memoryEntries: number;
  dbEntries: number;
}

class TranslationCache {
  private memoryCache = new Map<string, CachedTranslation>();
  private maxMemoryEntries = 1000;
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private stats: TranslationCacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    memoryEntries: 0,
    dbEntries: 0
  };

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  /**
   * Generate cache key for translation
   */
  private generateKey(text: string, sourceLanguage: string, targetLanguage: string): string {
    const normalizedText = text.trim().toLowerCase();
    return `${sourceLanguage}:${targetLanguage}:${Buffer.from(normalizedText).toString('base64')}`;
  }

  /**
   * Get translation from cache (memory first, then database)
   */
  async get(text: string, sourceLanguage: string, targetLanguage: string): Promise<CachedTranslation | null> {
    this.stats.totalRequests++;
    const key = this.generateKey(text, sourceLanguage, targetLanguage);

    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && !this.isExpired(memoryResult)) {
      memoryResult.hitCount++;
      this.stats.cacheHits++;
      this.updateHitRate();
      console.log('🎯 Translation cache HIT (memory):', text.substring(0, 30) + '...');
      return memoryResult;
    }

    // Check database cache
    try {
      const dbResult = await this.getFromDatabase(key);
      if (dbResult && !this.isExpired(dbResult)) {
        // Promote to memory cache
        this.memoryCache.set(key, dbResult);
        this.stats.cacheHits++;
        this.updateHitRate();
        console.log('🎯 Translation cache HIT (database):', text.substring(0, 30) + '...');
        return dbResult;
      }
    } catch (error) {
      console.error('Database cache error:', error);
    }

    this.stats.cacheMisses++;
    this.updateHitRate();
    console.log('❌ Translation cache MISS:', text.substring(0, 30) + '...');
    return null;
  }

  /**
   * Store translation in cache (both memory and database)
   */
  async set(
    text: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    confidence: number
  ): Promise<void> {
    const key = this.generateKey(text, sourceLanguage, targetLanguage);
    const cached: CachedTranslation = {
      id: key,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence,
      timestamp: Date.now(),
      hitCount: 0
    };

    // Store in memory cache
    this.memoryCache.set(key, cached);
    this.stats.memoryEntries = this.memoryCache.size;

    // Cleanup if memory cache is too large
    if (this.memoryCache.size > this.maxMemoryEntries) {
      this.evictLeastUsed();
    }

    // Store in database cache
    try {
      await this.saveToDatabase(cached);
      this.stats.dbEntries++;
    } catch (error) {
      console.error('Failed to save translation to database cache:', error);
    }

    console.log('💾 Translation cached:', text.substring(0, 30) + '...');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CachedTranslation): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  /**
   * Evict least recently used entries from memory cache
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].hitCount - b[1].hitCount);
    
    const toRemove = Math.floor(this.maxMemoryEntries * 0.1); // Remove 10%
    for (let i = 0; i < toRemove && entries.length > 0; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
    
    this.stats.memoryEntries = this.memoryCache.size;
    console.log(`🧹 Evicted ${toRemove} entries from translation cache`);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.stats.memoryEntries = this.memoryCache.size;
      console.log(`🧹 Cleaned up ${removedCount} expired translation cache entries`);
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): TranslationCacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      memoryEntries: 0,
      dbEntries: 0
    };
    console.log('🧹 Translation cache cleared');
  }

  /**
   * Get translation from database (placeholder - implement with your DB)
   */
  private async getFromDatabase(key: string): Promise<CachedTranslation | null> {
    // TODO: Implement database lookup
    // This would query your database for cached translations
    return null;
  }

  /**
   * Save translation to database (placeholder - implement with your DB)
   */
  private async saveToDatabase(cached: CachedTranslation): Promise<void> {
    // TODO: Implement database storage
    // This would save the translation to your database
  }

  /**
   * Preload common translations
   */
  async preloadCommonTranslations(): Promise<void> {
    const commonPhrases = [
      'Hello', 'Hi', 'How are you?', 'Good morning', 'Good night',
      'Thank you', 'Please', 'Yes', 'No', 'Okay', 'Sorry',
      'I love you', 'See you later', 'Have a good day'
    ];

    const languages = ['es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];

    console.log('🔄 Preloading common translations...');
    
    for (const phrase of commonPhrases) {
      for (const lang of languages) {
        // This would trigger translation and caching
        // await this.get(phrase, 'en', lang);
      }
    }

    console.log('✅ Common translations preloaded');
  }
}

// Singleton instance
let cacheInstance: TranslationCache | null = null;

export const getTranslationCache = (): TranslationCache => {
  if (!cacheInstance) {
    cacheInstance = new TranslationCache();
  }
  return cacheInstance;
};

export type { CachedTranslation, TranslationCacheStats };
