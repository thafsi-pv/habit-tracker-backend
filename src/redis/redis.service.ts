import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConfigured = false;

  private defaultTtl = 86400; // 24 hours default for low-concurrency daily tracking

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');
    const envTtl = this.configService.get<string>('REDIS_CACHE_TTL');
    if (envTtl && !isNaN(Number(envTtl))) {
      this.defaultTtl = Number(envTtl);
    }

    if (url && token && !url.includes('your-upstash-redis-url')) {
      try {
        this.client = new Redis({
          url,
          token,
        });
        this.isConfigured = true;
        this.logger.log(`Upstash Redis client initialized successfully (Default TTL: ${this.defaultTtl}s).`);
      } catch (err) {
        this.logger.error('Failed to initialize Upstash Redis client', err);
      }
    } else {
      this.logger.warn(
        'Upstash Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing). Redis caching will be bypassed.',
      );
    }
  }

  isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  getClient(): Redis | null {
    return this.client;
  }

  getDefaultTtl(): number {
    return this.defaultTtl;
  }

  /**
   * Get a cached value by key.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;
    try {
      const data = await this.client!.get<T>(key);
      return data ?? null;
    } catch (err) {
      this.logger.warn(`Redis GET failed for key "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Store a value in Redis with optional TTL in seconds (defaults to defaultTtl).
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return;
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtl;
    try {
      if (ttl > 0) {
        await this.client!.set(key, value, { ex: ttl });
      } else {
        await this.client!.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Redis SET failed for key "${key}": ${(err as Error).message}`);
    }
  }

  /**
   * Delete one or more keys.
   */
  async del(...keys: string[]): Promise<number> {
    if (!this.isAvailable() || keys.length === 0) return 0;
    try {
      const deleted = await this.client!.del(...keys);
      if (deleted > 0) {
        this.logger.log(`[CACHE INVALIDATE] Deleted ${deleted} key(s): [${keys.join(', ')}]`);
      }
      return deleted;
    } catch (err) {
      this.logger.warn(`Redis DEL failed for keys [${keys.join(', ')}]: ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * Delete all keys matching a glob pattern (e.g. "dashboard:*").
   */
  async delByPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.client!.del(...keys);
        this.logger.log(`[CACHE INVALIDATE] Deleted ${deleted} key(s) matching pattern "${pattern}": [${keys.join(', ')}]`);
        return deleted;
      }
      return 0;
    } catch (err) {
      this.logger.warn(`Redis delByPattern failed for pattern "${pattern}": ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * Check if a key exists.
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const count = await this.client!.exists(key);
      return count > 0;
    } catch (err) {
      this.logger.warn(`Redis EXISTS failed for key "${key}": ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Cache-aside helper: Returns cached data if available; otherwise executes the fetcher,
   * caches the result for ttlSeconds (or default 24h), and returns it.
   * Logs whether data was retrieved from Redis cache (HIT) or DB (MISS) with execution time in milliseconds.
   */
  async wrap<T>(
    key: string,
    ttlSecondsOrFetcher: number | undefined | (() => Promise<T>),
    fetcherOrNothing?: () => Promise<T>,
  ): Promise<T> {
    const ttlSeconds = typeof ttlSecondsOrFetcher === 'number' ? ttlSecondsOrFetcher : this.defaultTtl;
    const fetcher = typeof ttlSecondsOrFetcher === 'function' ? ttlSecondsOrFetcher : fetcherOrNothing!;

    const startTime = performance.now();

    if (!this.isAvailable()) {
      const result = await fetcher();
      const elapsed = (performance.now() - startTime).toFixed(2);
      this.logger.log(`[DB] Fetched "${key}" directly from Database (Redis disabled/bypassed) in ${elapsed}ms`);
      return result;
    }

    try {
      const cached = await this.get<T>(key);
      if (cached !== null && cached !== undefined) {
        const elapsed = (performance.now() - startTime).toFixed(2);
        this.logger.log(`[CACHE HIT] Loaded "${key}" from Redis cache in ${elapsed}ms`);
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis cache read failed for key "${key}": ${(err as Error).message}`);
    }

    const dbStartTime = performance.now();
    const result = await fetcher();
    const dbElapsed = (performance.now() - dbStartTime).toFixed(2);

    try {
      if (result !== undefined && result !== null) {
        await this.set(key, result, ttlSeconds);
      }
    } catch (err) {
      this.logger.warn(`Redis cache write failed for key "${key}": ${(err as Error).message}`);
    }

    const totalElapsed = (performance.now() - startTime).toFixed(2);
    this.logger.log(
      `[CACHE MISS -> DB] Fetched "${key}" from Database in ${dbElapsed}ms (cached for ${ttlSeconds}s, total: ${totalElapsed}ms)`,
    );

    return result;
  }
}
