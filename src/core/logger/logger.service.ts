import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  organizationId?: string;
  module?: string;
  method?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(private readonly configService: ConfigService) {}

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: 'sector-staff-v2',
      version: '2.1.0',
      environment: this.configService.nodeEnv,
      ...context,
    };

    return JSON.stringify(logEntry);
  }

  log(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  error(message: string, trace?: string, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(trace && { trace }),
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (this.configService.isDevelopment || this.configService.logLevel === 'debug') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  verbose(message: string, context?: LogContext): void {
    if (this.configService.isDevelopment || this.configService.logLevel === 'verbose') {
      console.log(this.formatMessage('verbose', message, context));
    }
  }

  // Convenience methods for common logging scenarios
  logUserAction(
    userId: string,
    action: string,
    details?: any,
    organizationId?: string,
    correlationId?: string,
  ): void {
    this.log(`User action: ${action}`, {
      userId,
      organizationId,
      correlationId,
      action,
      details,
      module: 'user-action',
    });
  }

  logDatabaseOperation(
    operation: string,
    entity: string,
    entityId?: string,
    userId?: string,
    organizationId?: string,
    correlationId?: string,
  ): void {
    this.log(`Database operation: ${operation} on ${entity}`, {
      operation,
      entity,
      entityId,
      userId,
      organizationId,
      correlationId,
      module: 'database',
    });
  }

  logSecurityEvent(
    event: string,
    details?: any,
    userId?: string,
    organizationId?: string,
    correlationId?: string,
  ): void {
    this.warn(`Security event: ${event}`, {
      event,
      details,
      userId,
      organizationId,
      correlationId,
      module: 'security',
    });
  }

  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    organizationId?: string,
    correlationId?: string,
  ): void {
    this.log(`API Request: ${method} ${url} - ${statusCode} (${responseTime}ms)`, {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      organizationId,
      correlationId,
      module: 'api',
    });
  }

  logQueueJob(
    jobName: string,
    jobId: string,
    status: 'started' | 'completed' | 'failed',
    duration?: number,
    error?: string,
    correlationId?: string,
  ): void {
    const level = status === 'failed' ? 'error' : 'info';
    const message = `Queue job ${jobName} (${jobId}) ${status}`;
    
    const context = {
      jobName,
      jobId,
      status,
      duration,
      error,
      correlationId,
      module: 'queue',
    };

    if (level === 'error') {
      this.error(message, error, context);
    } else {
      this.log(message, context);
    }
  }
}