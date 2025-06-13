import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskCommandService } from './services/task-command.service';
import { TaskQueryService } from './services/task-query.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { PaginationOptions } from '../../types/pagination.interface';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectQueue('task-processing') private taskQueue: Queue,
    private taskCommandService: TaskCommandService,
    private taskQueryService: TaskQueryService,
  ) {}

  // Facade methods to maintain compatibility with existing code
  async create(createTaskDto: CreateTaskDto) {
    return this.taskCommandService.handleCreateTaskCommand(createTaskDto);
  }

  async findAll(options: PaginationOptions & Partial<TaskFilterDto>) {
    return this.taskQueryService.handleGetTasksQuery(options, options);
  }

  async findOne(id: string) {
    return this.taskQueryService.handleGetTaskByIdQuery(id);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    return this.taskCommandService.handleUpdateTaskCommand(id, updateTaskDto);
  }

  async remove(id: string) {
    return this.taskCommandService.handleDeleteTaskCommand(id);
  }

  async getStats() {
    return this.taskQueryService.handleGetStatsQuery();
  }
}
