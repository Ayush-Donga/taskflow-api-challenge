import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskDomainService } from './task-domain.service';
import { TaskQueryService } from './task-query.service';
import { TaskStatus } from '../enums/task-status.enum';
import { RedisService } from '@common/services/redis.service';
import { CacheService } from '@common/services/cache.service';

@Injectable()
export class TaskCommandService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    private taskDomainService: TaskDomainService,
    private taskQueryService: TaskQueryService,
    private redisService: RedisService,
    private cacheService: CacheService,
  ) {}

  async handleCreateTaskCommand(createTaskDto: CreateTaskDto): Promise<Task> {
    this.taskDomainService.validateTaskCreation(createTaskDto);
    const task = this.taskDomainService.createFromDto(createTaskDto);

    return this.tasksRepository.manager.transaction(async transactionalEntityManager => {
      const savedTask = await transactionalEntityManager.save(Task, task);
      await this.taskQueue.add('task-created', {
        taskId: savedTask.id,
        status: savedTask.status,
      });
      return savedTask;
    });
  }

  async handleUpdateTaskCommand(id: string, updateDto: UpdateTaskDto): Promise<Task> {
    const lockKey = `lock:task:${id}`;
    const lockAcquired = await this.redisService.acquireLock(lockKey, 10000); // 10s

    if (!lockAcquired) {
      throw new ConflictException('Task is being updated. Please try again later.');
    }

    try {
      return await this.tasksRepository.manager.transaction(async transactionalEntityManager => {
        const task = await this.taskQueryService.handleGetTaskByIdQuery(id);
        if (!task) {
          throw new NotFoundException(`Task with ID ${id} not found`);
        }

        const originalStatus = task.status;
        const updatedTask = this.taskDomainService.applyUpdate(task, updateDto);
        const savedTask = await transactionalEntityManager.save(Task, updatedTask);

        if (originalStatus !== savedTask.status) {
          await this.taskQueue.add('task-status-updated', {
            taskId: savedTask.id,
            status: savedTask.status,
          });
        }

        // Invalidate cache
        await this.cacheService.delete(`task:${id}`);

        return savedTask;
      });
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  async handleDeleteTaskCommand(id: string): Promise<void> {
    const task = await this.taskQueryService.handleGetTaskByIdQuery(id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    await this.tasksRepository.manager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.remove(Task, task);
      await this.taskQueue.add('task-deleted', { taskId: id });
    });
  }

  async handleBatchProcessCommand(taskIds: string[], action: string): Promise<any[]> {
    return this.tasksRepository.manager.transaction(async transactionalEntityManager => {
      const results = [];
      const tasks = await this.taskQueryService.handleGetTasksByIdsQuery(taskIds);

      const foundTaskIds = tasks.map(task => task.id);
      const missingTaskIds = taskIds.filter(id => !foundTaskIds.includes(id));

      for (const id of missingTaskIds) {
        results.push({ taskId: id, success: false, error: `Task with ID ${id} not found` });
      }

      if (action === 'complete') {
        const updatedTasks = tasks.map(task => ({
          ...task,
          status: TaskStatus.COMPLETED,
        }));
        await transactionalEntityManager.save(Task, updatedTasks);
        for (const task of updatedTasks) {
          await this.taskQueue.add('task-status-updated', {
            taskId: task.id,
            status: TaskStatus.COMPLETED,
          });
          results.push({ taskId: task.id, success: true, result: task });
        }
      } else if (action === 'delete') {
        await transactionalEntityManager.remove(Task, tasks);
        for (const task of tasks) {
          await this.taskQueue.add('task-deleted', { taskId: task.id });
          results.push({ taskId: task.id, success: true, result: null });
        }
      }

      return results;
    });
  }

  async updateStatus(id: string, status: string): Promise<Task> {
    return this.tasksRepository.manager.transaction(async transactionalEntityManager => {
      const task = await this.taskQueryService.handleGetTaskByIdQuery(id);
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      const updatedTask = this.taskDomainService.updateStatus(task, status);
      const savedTask = await transactionalEntityManager.save(Task, updatedTask);
      await this.taskQueue.add('task-status-updated', {
        taskId: savedTask.id,
        status: savedTask.status,
      });
      return savedTask;
    });
  }
}
