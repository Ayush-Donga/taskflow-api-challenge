import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  constructor(private redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisService.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.redisService.set(key, serialized, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.redisService.exists(key);
    return exists === 1;
  }

  async clear(): Promise<void> {
    // Only for development use — risky in production
    await this.redisService.flushAll();
  }
}
