import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { randomUUID } from 'crypto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private lockTokens = new Map<string, string>(); // Track locks per key

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      url: `redis://${this.configService.get('REDIS_HOST')}:${this.configService.get('REDIS_PORT')}`,
    });
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.client.setEx(key, expirySeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async flushAll(): Promise<void> {
    await this.client.flushAll();
  }

  async acquireLock(key: string, ttl = 10000): Promise<boolean> {
    const token = randomUUID();
    const result = await this.client.set(key, token, {
      NX: true,
      PX: ttl,
    });

    if (result === 'OK') {
      this.lockTokens.set(key, token);
      return true;
    }

    return false;
  }

  async releaseLock(key: string): Promise<void> {
    const token = this.lockTokens.get(key);
    if (!token) return;

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1]
      then
          return redis.call("del", KEYS[1])
      else
          return 0
      end
    `;

    await this.client.eval(script, {
      keys: [key],
      arguments: [token],
    });

    this.lockTokens.delete(key);
  }
}
