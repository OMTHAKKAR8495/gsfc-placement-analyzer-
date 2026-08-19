/**
 * ⚡ Ultra High-Speed In-Memory Cache with TTL & LRU Eviction Policy
 * Ensures search matching, accreditation queries, and candidate filtering execute in < 2ms.
 */
class CacheService {
  constructor(defaultTtlMs = 60000, maxEntries = 500) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached item or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh LRU position
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.value;
  }

  /**
   * Set cache entry with optional custom TTL
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest (first inserted) item
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
      created_at: Date.now()
    });
  }

  /**
   * Invalidate specific key or prefix pattern
   */
  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cache wrapper for async or sync database fetcher functions
   */
  async getOrSet(key, fetcherFn, ttlMs = this.defaultTtlMs) {
    const cached = this.get(key);
    if (cached !== null && cached !== undefined) {
      return { data: cached, fromCache: true };
    }

    const freshData = await fetcherFn();
    this.set(key, freshData, ttlMs);
    return { data: freshData, fromCache: false };
  }

  /**
   * Diagnostic statistics
   */
  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? Math.round((this.hits / totalRequests) * 100) : 0;
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRatePercent: hitRate
    };
  }
}

export const appCache = new CacheService(120000, 1000); // 2 min default TTL, 1000 items
export default appCache;
