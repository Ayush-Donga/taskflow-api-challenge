import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { PaginationOptions, PaginatedResponse } from '../../types/pagination.interface';
import { TaskFilterDto } from './dto/task-filter.dto';
import { TaskPriority } from './enums/task-priority.enum';
import { TaskDomainService } from './services/task-domain.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    private taskDomainService: TaskDomainService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.taskDomainService.validateTaskCreation(createTaskDto);
    const task = this.taskDomainService.createFromDto(createTaskDto);

    return this.tasksRepository.manager.transaction(async transactionalEntityManager => {
      const savedTask = await transactionalEntityManager.save(Task, task);
      await this.taskQueue.add('task-status-update', {
        taskId: savedTask.id,
        status: savedTask.status,
      });
      return savedTask;
    });
  }

  async findAll(
    paginationOptions: PaginationOptions,
    filterOptions: Partial<TaskFilterDto>,
  ): Promise<PaginatedResponse<Task>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationOptions;
    const { status, priority, userId } = filterOptions;

    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .where('1=1');

    if (status) queryBuilder.andWhere('task.status = :status', { status });
    if (priority) queryBuilder.andWhere('task.priority = :priority', { priority });
    if (userId) queryBuilder.andWhere('task.userId = :userId', { userId });

    const [data, total] = await queryBuilder
      .orderBy(`task.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    return this.taskDomainService.ensureExists(task, id);
  }

  async update(id: string, updateDto: UpdateTaskDto): Promise<Task> {
    return this.tasksRepository.manager.transaction(async transactionalEntityManager => {
      const task = await this.findOne(id);
      const originalStatus = task.status;

      const updatedTask = this.taskDomainService.applyUpdate(task, updateDto);
      const savedTask = await transactionalEntityManager.save(Task, updatedTask);

      if (originalStatus !== savedTask.status) {
        await this.taskQueue.add('task-status-update', {
          taskId: savedTask.id,
          status: savedTask.status,
        });
      }

      return savedTask;
    });
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.tasksRepository.find({ where: { status } });
  }

  async updateStatus(id: string, status: string): Promise<Task> {
    return this.tasksRepository.manager.transaction(async manager => {
      const task = await this.findOne(id);
      const updatedTask = this.taskDomainService.updateStatus(task, status);
      return await manager.save(updatedTask);
    });
  }

  async getStats() {
    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .select('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE task.status = :completed)`, 'completed')
      .addSelect(`COUNT(*) FILTER (WHERE task.status = :inProgress)`, 'inProgress')
      .addSelect(`COUNT(*) FILTER (WHERE task.status = :pending)`, 'pending')
      .addSelect(`COUNT(*) FILTER (WHERE task.priority = :highPriority)`, 'highPriority')
      .setParameters({
        completed: TaskStatus.COMPLETED,
        inProgress: TaskStatus.IN_PROGRESS,
        pending: TaskStatus.PENDING,
        highPriority: TaskPriority.HIGH,
      });

    return queryBuilder.getRawOne();
  }
}
