import { CacheUtils, CacheStatus } from '@common/utils/cache.utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

export interface CacheResult<T> {
  data: T;
  status: CacheStatus;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getOrSet<T>(
    cacheKey: string,
    fallbackFn: () => Promise<T>,
    skipCache = false,
  ): Promise<CacheResult<T>> {
    if (skipCache) {
      return this.skipCache(cacheKey, fallbackFn);
    }

    const cachedData = await this.tryGetFromCache<T>(cacheKey);
    if (cachedData !== null) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return { data: cachedData, status: CacheUtils.CacheStatus.HIT };
    }

    // Cache miss - execute fallback and cache result
    this.logger.log(`Cache miss for ${cacheKey}`);
    const data = await fallbackFn();
    await this.trySetCache(cacheKey, data);

    return { data, status: CacheUtils.CacheStatus.MISS };
  }

  buildAiCacheKey(
    type: 'questions' | 'postits',
    userId: string,
    mandalaId: string,
    params: any,
  ): string {
    return CacheUtils.buildCacheKey(type, userId, mandalaId, params);
  }

  private async skipCache<T>(
    cacheKey: string,
    fallbackFn: () => Promise<T>,
  ): Promise<CacheResult<T>> {
    this.logger.log(`Cache skipped for ${cacheKey}`);
    const data = await fallbackFn();

    await this.trySetCache(cacheKey, data);

    return { data, status: CacheUtils.CacheStatus.SKIP };
  }

  private async tryGetFromCache<T>(cacheKey: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.get<T>(cacheKey);
      return result ?? null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Cache get failed for ${cacheKey}: ${errorMessage}`);
      return null;
    }
  }

  private async trySetCache<T>(cacheKey: string, data: T): Promise<void> {
    try {
      await this.cacheManager.set(cacheKey, data);
      this.logger.log(`Data cached for ${cacheKey}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to cache data for ${cacheKey}: ${errorMessage}`,
      );
    }
  }
}
