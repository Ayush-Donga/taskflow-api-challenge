import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskDomainService } from './services/task-domain.service';
import { TaskCommandService } from './services/task-command.service';
import { TaskQueryService } from './services/task-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    BullModule.registerQueue({
      name: 'task-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskDomainService, TaskCommandService, TaskQueryService],
  exports: [TasksService, TaskCommandService, TaskQueryService, TypeOrmModule],
})
export class TasksModule {}
