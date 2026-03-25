/**
 * Cache Manager - Optimized localStorage caching with TTL
 */

const VERSION = 'v1'; // Increment to invalidate all caches
const CACHE_KEYS = {
  NOTES: 'akmedu_notes',
  QUIZ: 'akmedu_quiz',
  PROGRESS: 'akmedu_progress',
  USER: 'akmedu_user',
};

class CacheManager {
  constructor() {
    this.maxSize = 5 * 1024 * 1024; // 5MB max cache
  }

  /**
   * Set cache with TTL (time to live)
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttlMinutes - Time to live in minutes (0 = no expiry)
   */
  set(key, value, ttlMinutes = 0) {
    try {
      const cacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlMinutes ? ttlMinutes * 60 * 1000 : 0,
      };

      const serialized = JSON.stringify(cacheEntry);

      // Check size before storing
      if (this.getStorageSize() + serialized.length > this.maxSize) {
        this.cleanup();
      }

      localStorage.setItem(`${VERSION}:${key}`, serialized);
      return true;
    } catch (e) {
      console.warn('Cache write failed:', e);
      return false;
    }
  }

  /**
   * Get cache with TTL check
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if expired
   */
  get(key) {
    try {
      const stored = localStorage.getItem(`${VERSION}:${key}`);
      if (!stored) return null;

      const cacheEntry = JSON.parse(stored);

      // Check if expired
      if (cacheEntry.ttl && Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
        this.remove(key);
        return null;
      }

      return cacheEntry.data;
    } catch (e) {
      console.warn('Cache read failed:', e);
      return null;
    }
  }

  /**
   * Remove cache entry
   */
  remove(key) {
    localStorage.removeItem(`${VERSION}:${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(VERSION)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get approximate cache size
   */
  getStorageSize() {
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(VERSION)) {
        size += localStorage.getItem(key).length;
      }
    });
    return size;
  }

  /**
   * Cleanup oldest entries when cache is full
   */
  cleanup() {
    const entries = [];
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(VERSION)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          entries.push({ key, timestamp: data.timestamp });
        } catch (e) {
          // Skip invalid entries
        }
      }
    });

    // Sort by timestamp and remove oldest 25%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const removeCount = Math.ceil(entries.length * 0.25);

    for (let i = 0; i < removeCount; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Convenience functions for notes caching
export function cacheNotes(subject, chapter, notes, ttl = 1440) {
  const key = `${CACHE_KEYS.NOTES}:${subject}:${chapter}`;
  return cacheManager.set(key, notes, ttl);
}

export function getCachedNotes(subject, chapter) {
  const key = `${CACHE_KEYS.NOTES}:${subject}:${chapter}`;
  return cacheManager.get(key);
}

// Convenience functions for quiz caching
export function cacheQuiz(subject, chapter, quiz, ttl = 1440) {
  const key = `${CACHE_KEYS.QUIZ}:${subject}:${chapter}`;
  return cacheManager.set(key, quiz, ttl);
}

export function getCachedQuiz(subject, chapter) {
  const key = `${CACHE_KEYS.QUIZ}:${subject}:${chapter}`;
  return cacheManager.get(key);
}
