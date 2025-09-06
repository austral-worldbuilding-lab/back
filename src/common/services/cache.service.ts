import { CacheUtils } from '@common/utils/cache.utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  buildCacheKey(
    type: 'questions' | 'postits',
    userId: string,
    mandalaId: string,
  ): string {
    return CacheUtils.buildSimpleCacheKey(type, userId, mandalaId);
  }

  async addToLimitedCache<T>(
    cacheKey: string,
    newData: T,
    maxItems = 20,
  ): Promise<void> {
    try {
      const existing = (await this.cacheManager.get<T[]>(cacheKey)) || [];
      const updated = [newData, ...existing].slice(0, maxItems);
      await this.cacheManager.set(cacheKey, updated);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to add to limited cache ${cacheKey}: ${errorMessage}`,
      );
    }
  }
}
