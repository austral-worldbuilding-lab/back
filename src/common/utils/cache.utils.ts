import * as crypto from 'crypto';

export class CacheUtils {
  static hashParams(params: any): string {
    const normalized = JSON.stringify(params, Object.keys(params).sort());
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  static buildCacheKey(
    type: 'questions' | 'postits',
    userId: string,
    mandalaId: string,
    params: any,
  ): string {
    const paramsHash = this.hashParams(params);
    return `ai:${type}:${userId}:${mandalaId}:${paramsHash}`;
  }

  static readonly CacheStatus = {
    HIT: 'HIT',
    MISS: 'MISS',
    SKIP: 'SKIP',
  } as const;
}

export type CacheStatus =
  (typeof CacheUtils.CacheStatus)[keyof typeof CacheUtils.CacheStatus];
