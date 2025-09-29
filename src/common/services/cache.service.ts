import { AppLogger } from '@common/services/logger.service';
import { CacheUtils } from '@common/utils/cache.utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CacheService.name);
  }

  buildCacheKey(
    type: 'questions' | 'postits' | 'provocations',
    userId: string,
    scopeId: string,
  ): string {
    return CacheUtils.buildSimpleCacheKey(type, userId, scopeId);
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

  async getFromCache<T>(cacheKey: string): Promise<T[]> {
    try {
      return (await this.cacheManager.get<T[]>(cacheKey)) || [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to get from cache ${cacheKey}: ${errorMessage}`);
      return [];
    }
  }
}
