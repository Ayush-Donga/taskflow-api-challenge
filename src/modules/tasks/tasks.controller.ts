import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Body,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { TaskQueryService } from './services/task-query.service';
import { TaskCommandService } from './services/task-command.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { PaginationOptions } from '../../types/pagination.interface';

class JwtAuthGuard {}

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ limit: 100, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly taskCommandService: TaskCommandService,
    private readonly taskQueryService: TaskQueryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskCommandService.handleCreateTaskCommand(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with optional filters' })
  async findAll(@Query() filterDto: TaskFilterDto) {
    return this.taskQueryService.handleGetTasksQuery(filterDto, filterDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats() {
    return this.taskQueryService.handleGetStatsQuery();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a task by ID' })
  async findOne(@Param('id') id: string) {
    const task = await this.taskQueryService.handleGetTaskByIdQuery(id);
    if (!task) {
      throw new HttpException(`Task with ID ${id} not found`, HttpStatus.NOT_FOUND);
    }
    return task;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const task = await this.taskCommandService.handleUpdateTaskCommand(id, updateTaskDto);
    if (!task) {
      throw new HttpException(`Task with ID ${id} not found`, HttpStatus.NOT_FOUND);
    }
    return task;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async remove(@Param('id') id: string) {
    await this.taskCommandService.handleDeleteTaskCommand(id);
    return { message: `Task with ID ${id} deleted successfully` };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  async batchProcess(@Body() operations: { tasks: string[]; action: string }) {
    const { tasks: taskIds, action } = operations;
    if (!['complete', 'delete'].includes(action)) {
      throw new HttpException(`Invalid action: ${action}`, HttpStatus.BAD_REQUEST);
    }

    const results = await this.taskCommandService.handleBatchProcessCommand(taskIds, action);
    return results;
  }
}
