import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import winston from 'winston';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const winstonFormat = winston?.format;

    if (!winstonFormat || typeof winstonFormat.combine !== 'function') {
      console.warn('Winston format is undefined or invalid. Falling back to console logging.');
      this.logger = console as any;
      return;
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winstonFormat.combine(winstonFormat.timestamp(), winstonFormat.json()),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  log(message: string, metadata?: Record<string, any>) {
    this.logger.info?.(message, metadata);
  }

  error(message: string, trace?: string, metadata?: Record<string, any>) {
    this.logger.error?.(message, { trace, ...metadata });
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.logger.warn?.(message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.logger.debug?.(message, metadata);
  }
}
