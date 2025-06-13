import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskPriority } from '../enums/task-priority.enum';

@Injectable()
export class TaskDomainService {
  validateTaskCreation(taskDto: CreateTaskDto): void {
    if (!taskDto.title) {
      throw new HttpException('Task title is required', HttpStatus.BAD_REQUEST);
    }
    // Add more domain rules as needed
  }

  createFromDto(dto: CreateTaskDto): Task {
    const task = new Task();
    task.title = dto.title;
    task.description = dto.description ?? '';
    task.priority = dto.priority ?? TaskPriority.MEDIUM;
    if (dto.dueDate) {
      task.dueDate = new Date(dto.dueDate);
    }
    task.status = TaskStatus.PENDING;
    task.userId = dto.userId;
    return task;
  }

  applyUpdate(task: Task, updateDto: UpdateTaskDto): Task {
    Object.assign(task, updateDto);
    return task;
  }

  updateStatus(task: Task, newStatus: string): Task {
    if (!Object.values(TaskStatus).includes(newStatus as TaskStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    task.status = newStatus as TaskStatus;
    return task;
  }

  ensureExists(task: Task | null, id: string): Task {
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }
}
