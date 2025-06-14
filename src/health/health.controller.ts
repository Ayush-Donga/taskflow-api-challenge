import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { BullHealthIndicator } from './bull.health';
import { register } from 'prom-client';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private bull: BullHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database'), () => this.bull.check('bull')]);
  }

  @Get('metrics')
  async getMetrics() {
    return register.metrics();
  }
}
