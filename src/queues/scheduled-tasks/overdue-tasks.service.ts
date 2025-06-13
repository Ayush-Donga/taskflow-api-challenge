import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OverdueTasksService {
  private readonly logger = new Logger(OverdueTasksService.name);

  constructor(
    @InjectQueue('task-processing')
    private readonly taskQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.debug('Checking for overdue tasks...');

    try {
      // Queue a single overdue-tasks-notification job to process tasks in TaskProcessorService
      await this.taskQueue.add(
        'overdue-tasks-notification',
        {},
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
      this.logger.log('Queued overdue tasks notification job');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue overdue tasks job: ${errorMessage}`);
    }

    this.logger.debug('Overdue tasks check completed');
  }
}
