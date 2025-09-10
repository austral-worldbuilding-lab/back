export class CacheUtils {
  static buildSimpleCacheKey(
    type: 'questions' | 'postits',
    userId: string,
    mandalaId: string,
  ): string {
    return `ai:${type}:${userId}:${mandalaId}`;
  }

  static readonly CacheStatus = {
    HIT: 'HIT',
    MISS: 'MISS',
    SKIP: 'SKIP',
  } as const;
}

export type CacheStatus =
  (typeof CacheUtils.CacheStatus)[keyof typeof CacheUtils.CacheStatus];
