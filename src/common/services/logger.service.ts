import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

interface LogData {
  requestId?: string;
  userId?: string;
  context?: string;
  level: string;
  message: string;
  timestamp: string;
  trace?: string;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(private readonly cls: ClsService) {}

  setContext(context: string) {
    this.context = context;
  }

  private buildLogData(
    level: string,
    message: string,
    metadata?: Record<string, any>,
    trace?: string,
  ): LogData {
    return {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.cls.getId(),
      userId: this.cls.get('userId'),
      context: this.context,
      message,
      ...(trace && { trace }),
      ...(metadata && metadata),
    };
  }

  private output(logData: LogData) {
    const cleanData = Object.fromEntries(
      Object.entries(logData).filter(([_, v]) => v !== undefined),
    );

    console.log(JSON.stringify(cleanData));
  }

  log(message: string, metadata?: Record<string, any>) {
    this.output(this.buildLogData('log', message, metadata));
  }

  error(message: string, trace?: string, metadata?: Record<string, any>) {
    this.output(this.buildLogData('error', message, metadata, trace));
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.output(this.buildLogData('warn', message, metadata));
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.output(this.buildLogData('debug', message, metadata));
  }

  verbose(message: string, metadata?: Record<string, any>) {
    this.output(this.buildLogData('verbose', message, metadata));
  }
}
