import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly requestCounter: Counter<string>;
  private readonly requestDuration: Histogram<string>;

  constructor() {
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status'],
    });

    this.requestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'endpoint'],
      buckets: [50, 100, 200, 300, 500, 1000],
    });
  }

  incrementRequest(method: string, endpoint: string, status: number) {
    this.requestCounter.inc({ method, endpoint, status });
  }

  observeRequestDuration(method: string, endpoint: string, duration: number) {
    this.requestDuration.observe({ method, endpoint }, duration);
  }
}
