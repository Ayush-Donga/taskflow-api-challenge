import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class BullHealthIndicator extends HealthIndicator {
  constructor(@InjectQueue('default') private readonly queue: Queue) {
    super();
  }

  async check(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if the queue is ready/connected
      const isConnected = await this.queue.client.ping();
      if (isConnected) {
        return this.getStatus(key, true, { message: 'Bull queue is healthy' });
      } else {
        throw new Error('Bull queue is not connected');
      }
    } catch (error) {
      const err = error as Error;
      throw new HealthCheckError(
        'BullHealthIndicator failed',
        this.getStatus(key, false, { message: err.message }),
      );
    }
  }
}
