export class CacheUtils {
  static buildSimpleCacheKey(
    type: 'questions' | 'postits' | 'provocations',
    userId: string,
    scopeId: string,
  ): string {
    return `ai:${type}:${userId}:${scopeId}`;
  }

  static readonly CacheStatus = {
    HIT: 'HIT',
    MISS: 'MISS',
    SKIP: 'SKIP',
  } as const;
}

export type CacheStatus =
  (typeof CacheUtils.CacheStatus)[keyof typeof CacheUtils.CacheStatus];
