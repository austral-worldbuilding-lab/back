export class CacheUtils {
  static buildSimpleCacheKey(
    type: 'questions' | 'postits' | 'provocations' | 'solutions',
    userId: string,
    scopeId: string,
  ): string {
    return `ai:${type}:${userId}:${scopeId}`;
  }

  static buildProjectCacheKey(type: 'solutions', projectId: string): string {
    return `ai:${type}:project:${projectId}`;
  }

  static readonly CacheStatus = {
    HIT: 'HIT',
    MISS: 'MISS',
    SKIP: 'SKIP',
  } as const;
}

export type CacheStatus =
  (typeof CacheUtils.CacheStatus)[keyof typeof CacheUtils.CacheStatus];
