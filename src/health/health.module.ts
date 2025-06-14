import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bull';
import { HealthController } from './health.controller';
import { TypeOrmHealthIndicator } from '@nestjs/terminus';
import { BullHealthIndicator } from './bull.health';

@Module({
  imports: [
    TerminusModule,
    BullModule.registerQueue({
      name: 'default',
    }),
  ],
  controllers: [HealthController],
  providers: [TypeOrmHealthIndicator, BullHealthIndicator],
})
export class HealthModule {}
