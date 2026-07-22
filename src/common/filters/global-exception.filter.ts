import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface StandardErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
}

interface HttpExceptionResponse {
  message?: unknown;
  error?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();
    const statusCode = this.getStatusCode(exception);
    const exceptionResponse = this.getExceptionResponse(exception);

    const payload: StandardErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      method: request.method,
      message: this.getMessage(exception, exceptionResponse),
      error: this.getError(exception, exceptionResponse, statusCode),
    };

    response.status(statusCode).json(payload);
  }

  private getStatusCode(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getExceptionResponse(
    exception: unknown,
  ): HttpExceptionResponse | string | null {
    if (!(exception instanceof HttpException)) {
      return null;
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    return this.isRecord(response) ? response : null;
  }

  private getMessage(
    exception: unknown,
    response: HttpExceptionResponse | string | null,
  ): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    if (typeof response === 'string') {
      return response;
    }

    if (response) {
      if (typeof response.message === 'string') {
        return response.message;
      }

      if (Array.isArray(response.message)) {
        const messages = response.message.filter(
          (message): message is string => typeof message === 'string',
        );

        if (messages.length > 0) {
          return messages;
        }
      }
    }

    return exception.message;
  }

  private getError(
    exception: unknown,
    response: HttpExceptionResponse | string | null,
    statusCode: number,
  ): string {
    if (!(exception instanceof HttpException)) {
      return 'Internal Server Error';
    }

    if (
      typeof response !== 'string' &&
      response !== null &&
      typeof response.error === 'string'
    ) {
      return response.error;
    }

    const statusName = HttpStatus[statusCode];

    if (typeof statusName !== 'string') {
      return exception.name;
    }

    return statusName
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private isRecord(value: unknown): value is HttpExceptionResponse {
    return typeof value === 'object' && value !== null;
  }
}
