/**
 * Supabase Query Optimization Utilities
 * Implements query batching, caching, and pagination
 */

import { cacheManager } from './cacheManager';

/**
 * Batch multiple queries with request deduplication
 */
class QueryBatcher {
  constructor(batchDelayMs = 10) {
    this.queue = [];
    this.batchDelayMs = batchDelayMs;
    this.timer = null;
  }

  /**
   * Add query to batch
   */
  add(queryFn, cacheKey = null, ttlMinutes = 60) {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (cacheKey) {
        const cached = cacheManager.get(cacheKey);
        if (cached) {
          resolve(cached);
          return;
        }
      }

      this.queue.push({ queryFn, cacheKey, ttlMinutes, resolve, reject });

      // Clear existing timer and set new one
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.executeBatch(), this.batchDelayMs);
    });
  }

  /**
   * Execute all batched queries
   */
  async executeBatch() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);

    // Execute all queries in parallel
    const promises = batch.map(async ({ queryFn, cacheKey, ttlMinutes, resolve, reject }) => {
      try {
        const result = await queryFn();

        // Cache result for future queries
        if (cacheKey) {
          cacheManager.set(cacheKey, result, ttlMinutes);
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    await Promise.allSettled(promises);
  }
}

export const queryBatcher = new QueryBatcher();

/**
 * Paginated query with automatic cleanup
 */
export class PaginatedQuery {
  constructor(supabaseQuery, pageSize = 50) {
    this.query = supabaseQuery;
    this.pageSize = pageSize;
    this.currentPage = 0;
    this.cachedPages = new Map();
  }

  /**
   * Get specific page
   */
  async getPage(pageNum) {
    // Check cache
    if (this.cachedPages.has(pageNum)) {
      return this.cachedPages.get(pageNum);
    }

    const start = pageNum * this.pageSize;
    const end = start + this.pageSize - 1;

    const { data, error } = await this.query
      .range(start, end)
      .select();

    if (error) throw error;

    // Store in cache with limit to 5 pages
    this.cachedPages.set(pageNum, data);
    if (this.cachedPages.size > 5) {
      const oldestKey = this.cachedPages.keys().next().value;
      this.cachedPages.delete(oldestKey);
    }

    return data;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cachedPages.clear();
  }
}

/**
 * Query result caching with automatic invalidation
 */
export function createCachedQuery(queryKey, queryFn, ttlMinutes = 60) {
  return async function(...args) {
    const cacheKey = `query:${queryKey}:${JSON.stringify(args)}`;

    // Try cache first
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    // Execute query
    const result = await queryFn(...args);

    // Cache result
    cacheManager.set(cacheKey, result, ttlMinutes);

    return result;
  };
}

/**
 * Debounced query for frequently called queries (like search)
 */
export function createDebouncedQuery(queryFn, delayMs = 300) {
  let timeoutId = null;

  return function(...args) {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        try {
          const result = await queryFn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
}
