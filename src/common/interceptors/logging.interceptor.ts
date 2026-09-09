import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();
    const path = request.originalUrl || request.url;

    return next.handle().pipe(
      tap(() => {
        this.logRequest(request.method, path, response.statusCode, startedAt);
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        this.logRequest(request.method, path, statusCode, startedAt);

        return throwError(() => error);
      }),
    );
  }

  private logRequest(
    method: string,
    path: string,
    statusCode: number,
    startedAt: number,
  ): void {
    const payload = {
      timestamp: new Date().toISOString(),
      context: 'HTTP',
      method,
      path,
      statusCode,
      responseTimeMs: Date.now() - startedAt,
    };

    const message = JSON.stringify(payload);

    if (statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
