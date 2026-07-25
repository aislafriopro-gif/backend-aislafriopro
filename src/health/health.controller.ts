import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificar el estado de los servicios' })
  @ApiResponse({
    status: 200,
    description: 'Todos los servicios estan operativos',
  })
  @ApiResponse({
    status: 503,
    description: 'Uno o mas servicios no estan disponibles',
  })
  async check(@Res() res: Response): Promise<void> {
    const timestamp = new Date().toISOString();

    try {
      const result = await this.health.check([
        () => this.db.pingCheck('database'),
      ]);

      const dbInfo = result.details?.database as
        { status?: string; responseTime?: number } | undefined;
      const responseTime = dbInfo?.responseTime
        ? `${dbInfo.responseTime}ms`
        : 'N/A';

      res.status(HttpStatus.OK).json({
        status: 'ok',
        timestamp,
        services: {
          database: {
            status: 'up',
            type: 'postgresql',
            responseTime,
          },
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Database connection failed';

      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        timestamp,
        services: {
          database: {
            status: 'down',
            type: 'postgresql',
            error: message,
          },
        },
      });
    }
  }
}
