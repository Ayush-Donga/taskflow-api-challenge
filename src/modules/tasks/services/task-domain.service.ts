import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

@Injectable()
export class TaskDomainService {
  validateTaskCreation(taskDto: CreateTaskDto): void {
    if (!taskDto.title) {
      throw new HttpException('Task title is required', HttpStatus.BAD_REQUEST);
    }

    if (taskDto.dueDate && isNaN(Date.parse(taskDto.dueDate))) {
      throw new HttpException('Invalid due date format', HttpStatus.BAD_REQUEST);
    }

    if (taskDto.priority && !Object.values(TaskPriority).includes(taskDto.priority)) {
      throw new HttpException(`Invalid priority: ${taskDto.priority}`, HttpStatus.BAD_REQUEST);
    }

    if (taskDto.status && !Object.values(TaskStatus).includes(taskDto.status)) {
      throw new HttpException(`Invalid status: ${taskDto.status}`, HttpStatus.BAD_REQUEST);
    }

    if (!taskDto.userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
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
      throw new HttpException(`Invalid status: ${newStatus}`, HttpStatus.BAD_REQUEST);
    }
    task.status = newStatus as TaskStatus;
    return task;
  }
}
