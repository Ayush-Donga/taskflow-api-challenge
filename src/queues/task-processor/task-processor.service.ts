import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TasksService } from '../../modules/tasks/tasks.service';

@Injectable()
@Processor('task-processing')
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

  // Inefficient implementation:
  // - No proper job batching
  // - No error handling strategy
  // - No retries for failed jobs
  // - No concurrency control
  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case 'task-status-update':
          return await this.handleStatusUpdate(job);
        case 'overdue-tasks-notification':
          return await this.handleOverdueTasks(job);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      // Basic error logging without proper handling or retries
      this.logger.error(
        `Error processing job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error; // Simply rethrows the error without any retry strategy
    }
  }

  private async handleStatusUpdate(job: Job) {
    const { taskId, status } = job.data;

    if (!taskId || !status) {
      this.logger.warn(`Invalid job data for task-status-update: ${JSON.stringify(job.data)}`);
      return { success: false, error: 'Missing required data' };
    }

    try {
      const task = await this.tasksService.updateStatus(taskId, status);

      this.logger.log(`Task ${task.id} status updated to ${task.status}`);
      return {
        success: true,
        taskId: task.id,
        newStatus: task.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Failed to update task status: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async handleOverdueTasks(job: Job) {
    // Inefficient implementation with no batching or chunking for large datasets
    this.logger.debug('Processing overdue tasks notification');

    // The implementation is deliberately basic and inefficient
    // It should be improved with proper batching and error handling
    return { success: true, message: 'Overdue tasks processed' };
  }
}
