import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

interface LogData {
  requestId?: string;
  userId?: string;
  context?: string;
  level: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(private readonly cls: ClsService) {}

  setContext(context: string): void {
    this.context = context;
  }

  private buildLogData(
    level: string,
    message: unknown,
    optionalParams: unknown[],
  ): LogData {
    const messageStr =
      typeof message === 'string' ? message : JSON.stringify(message);

    const data: LogData = {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.cls.getId(),
      userId: this.cls.get('userId'),
      context: this.context,
      message: messageStr,
    };

    optionalParams.forEach((param, index) => {
      if (param instanceof Error) {
        data.trace = param.stack;
        data.error = {
          name: param.name,
          message: param.message,
        };
      } else if (typeof param === 'object' && param !== null) {
        Object.assign(data, param);
      } else {
        data[`param_${index}`] = param;
      }
    });

    return data;
  }

  private output(logData: LogData): void {
    const cleanData = Object.fromEntries(
      Object.entries(logData).filter(([, value]) => value !== undefined),
    );

    console.log(JSON.stringify(cleanData));
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.output(this.buildLogData('log', message, optionalParams));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.output(this.buildLogData('error', message, optionalParams));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.output(this.buildLogData('warn', message, optionalParams));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.output(this.buildLogData('debug', message, optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.output(this.buildLogData('verbose', message, optionalParams));
  }
}
