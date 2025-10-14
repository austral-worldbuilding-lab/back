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

  private readonly colors = {
    log: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    debug: '\x1b[35m', // Magenta
    verbose: '\x1b[36m', // Cyan
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
  };

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
      requestId: this.cls.get('requestId'),
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

  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('es-AR', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }

  private output(logData: LogData): void {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const prettyJson = process.env.PRETTY_LOGS === 'true' || isDevelopment;

    if (isDevelopment) {
      this.outputPretty(logData);
    } else {
      this.outputJson(logData, prettyJson);
    }
  }

  private outputPretty(logData: LogData): void {
    const { timestamp, level, context, message, requestId, userId, ...rest } =
      logData;
    const color =
      this.colors[level as keyof typeof this.colors] || this.colors.reset;
    const levelUpper = level.toUpperCase().padEnd(7);

    // Log line similar to NestJS default format with colors
    let logLine = `${this.colors.dim}[Nest]${this.colors.reset} `;
    logLine += `${process.pid}  - `;
    logLine += `${this.colors.dim}${this.formatTimestamp(timestamp)}${this.colors.reset} `;
    logLine += `${color}${levelUpper}${this.colors.reset} `;

    if (context) {
      logLine += `${this.colors.bold}[${context}]${this.colors.reset} `;
    }

    logLine += message;

    console.log(logLine);

    // Print additional metadata if present
    const metadata: Record<string, unknown> = {};
    if (requestId) metadata.requestId = requestId;
    if (userId) metadata.userId = userId;

    // Add any extra properties
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        metadata[key] = value;
      }
    });

    if (Object.keys(metadata).length > 0) {
      console.log(
        `${this.colors.dim}${JSON.stringify(metadata, null, 2)}${this.colors.reset}`,
      );
    }

    // Print stack trace if it's an error
    if (logData.trace && typeof logData.trace === 'string') {
      console.log(`${this.colors.dim}${logData.trace}${this.colors.reset}`);
    }
  }

  private outputJson(logData: LogData, colorize = false): void {
    const cleanData = Object.fromEntries(
      Object.entries(logData).filter(([, value]) => value !== undefined),
    );

    if (colorize) {
      console.log(this.colorizeJson(cleanData));
    } else {
      console.log(JSON.stringify(cleanData));
    }
  }

  private colorizeJson(obj: Record<string, unknown>): string {
    const json = JSON.stringify(obj, null, 2);

    return json
      .replace(/"([^"]+)":/g, `${this.colors.verbose}"$1"${this.colors.reset}:`) // Keys in cyan
      .replace(/: "([^"]*)"/g, `: ${this.colors.reset}"$1"`) // String values
      .replace(/: (\d+\.?\d*)/g, `: ${this.colors.reset}$1`) // Numbers
      .replace(
        /: (true|false)/g,
        `: ${this.colors.verbose}$1${this.colors.reset}`,
      ) // Booleans
      .replace(/: (null)/g, `: ${this.colors.dim}$1${this.colors.reset}`); // Null
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
