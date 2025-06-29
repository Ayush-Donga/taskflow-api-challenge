import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { PaginationOptions, PaginatedResponse } from '../../../types/pagination.interface';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskFilterDto } from '../dto/task-filter.dto';
import { CacheService } from '@common/services/cache.service';

@Injectable()
export class TaskQueryService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private cacheService: CacheService,
  ) {}

  async handleGetTasksQuery(
    paginationOptions: PaginationOptions,
    filterOptions: Partial<TaskFilterDto>,
  ): Promise<PaginatedResponse<Task>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationOptions;
    const { status, priority, userId, dueDate } = filterOptions;

    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .where('1=1');

    if (status) queryBuilder.andWhere('task.status = :status', { status });
    if (priority) queryBuilder.andWhere('task.priority = :priority', { priority });
    if (userId) queryBuilder.andWhere('task.userId = :userId', { userId });
    if (dueDate) queryBuilder.andWhere('task.dueDate < :dueDate', { dueDate });

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

  async handleGetTaskByIdQuery(id: string): Promise<Task | null> {
    const cacheKey = `task:${id}`;
    const cached = await this.cacheService.get<Task>(cacheKey);

    if (cached) return cached;

    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (task) {
      await this.cacheService.set(cacheKey, task, 300); // Cache for 5 mins
    }

    return task;
  }

  async handleGetTasksByIdsQuery(ids: string[]): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { id: In(ids) },
      relations: ['user'],
    });
  }

  async handleGetStatsQuery() {
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
