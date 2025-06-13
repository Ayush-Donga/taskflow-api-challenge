import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitOptions, RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { RedisService } from '../../common/services/redis.service';
import { createHash } from 'crypto';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler()) || {
      limit: 100,
      windowMs: 60 * 1000,
    };
    const request = context.switchToHttp().getRequest();
    const ip = createHash('sha256').update(request.ip).digest('hex'); // Anonymize IP
    const key = `rate-limit:${ip}:${context.getHandler().name}`;

    const count = await this.redisService.incr(key);
    if (count === 1) {
      await this.redisService.expire(key, options.windowMs / 1000);
    }

    if (count > options.limit) {
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Rate limit exceeded',
          message: `You have exceeded the ${options.limit} requests per ${options.windowMs / 1000} seconds limit.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
