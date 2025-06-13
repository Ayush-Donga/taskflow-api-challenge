import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TaskCommandService } from '../../modules/tasks/services/task-command.service';
import { TaskQueryService } from '../../modules/tasks/services/task-query.service';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';
import { LessThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
@Processor('task-processing', {
  concurrency: 5,
})
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(
    private readonly taskCommandService: TaskCommandService,
    private readonly taskQueryService: TaskQueryService,
    @InjectQueue('task-processing')
    private readonly taskQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name}, attempt ${job.attemptsMade + 1}`,
    );

    if (job.attemptsMade >= (job.opts?.attempts ?? 3)) {
      this.logger.warn(`Job ${job.id} has exceeded retry limit`);
      return { success: false, error: 'Max retry limit reached' };
    }

    try {
      switch (job.name) {
        case 'task-created':
          return await this.handleTaskCreated(job);
        case 'task-status-update':
          return await this.handleStatusUpdate(job);
        case 'overdue-tasks-notification':
          return await this.handleOverdueTasks(job);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: `Unknown job type: ${job.name}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing job ${job.id}: ${errorMessage}`);
      throw new Error(`Job ${job.id} failed: ${errorMessage}`);
    }
  }

  private async handleTaskCreated(job: Job): Promise<any> {
    const { taskId, status } = job.data;

    if (!taskId || !status) {
      this.logger.warn(`Invalid job data for task-created: ${JSON.stringify(job.data)}`);
      return { success: false, error: 'Missing required data' };
    }

    try {
      const task = await this.taskQueryService.handleGetTaskByIdQuery(taskId);
      if (!task) {
        this.logger.warn(`Task ${taskId} not found for task-created job`);
        return { success: false, error: `Task ${taskId} not found` };
      }
      this.logger.log(`Task ${task.id} created with status ${task.status}`);
      // Placeholder for additional logic (e.g., send notification, update metrics)
      return {
        success: true,
        taskId: task.id,
        status: task.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process task-created job: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private async handleStatusUpdate(job: Job): Promise<any> {
    const { taskId, status } = job.data;

    if (!taskId || !status) {
      this.logger.warn(`Invalid job data for task-status-update: ${JSON.stringify(job.data)}`);
      return { success: false, error: 'Missing required data' };
    }

    try {
      const task = await this.taskCommandService.updateStatus(taskId, status);
      this.logger.log(`Task ${task.id} status updated to ${task.status}`);
      return {
        success: true,
        taskId: task.id,
        newStatus: task.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update task status: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private async handleOverdueTasks(job: Job): Promise<any> {
    this.logger.debug('Processing overdue tasks notification');

    try {
      const batchSize = 100;
      let page = 1;
      let hasMore = true;
      const results = [];

      while (hasMore) {
        const overdueTasks = await this.taskQueryService.handleGetTasksQuery(
          { page, limit: batchSize, sortBy: 'dueDate', sortOrder: 'ASC' },
          { status: TaskStatus.PENDING, dueDate: LessThan(new Date()) },
        );

        const tasks = overdueTasks.data;
        if (tasks.length === 0) {
          hasMore = false;
          break;
        }

        for (const task of tasks) {
          try {
            this.logger.log(
              `Sending notification for overdue task ${task.id} (due: ${task.dueDate})`,
            );
            await this.taskQueue.add('send-notification', {
              taskId: task.id,
              message: `Task ${task.id} is overdue (due: ${task.dueDate})`,
            });
            results.push({
              taskId: task.id,
              success: true,
              message: `Notification queued for task ${task.id}`,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.push({
              taskId: task.id,
              success: false,
              error: errorMessage,
            });
          }
        }

        page++;
      }

      this.logger.log(`Processed ${results.length} overdue tasks`);
      return {
        success: true,
        message: `Processed ${results.length} overdue tasks`,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process overdue tasks: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
