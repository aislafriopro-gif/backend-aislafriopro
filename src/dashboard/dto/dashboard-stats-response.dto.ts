import { ApiProperty } from '@nestjs/swagger';

class QuotesByStatusDto {
  @ApiProperty({ example: 3 })
  NEW!: number;

  @ApiProperty({ example: 2 })
  IN_PROGRESS!: number;

  @ApiProperty({ example: 1 })
  RESOLVED!: number;

  @ApiProperty({ example: 0 })
  REJECTED!: number;
}

class WorkOrdersByStatusDto {
  @ApiProperty({ example: 0 })
  PENDING!: number;

  @ApiProperty({ example: 0 })
  IN_PROGRESS!: number;

  @ApiProperty({ example: 0 })
  COMPLETED!: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ example: 10 })
  totalQuotes!: number;

  @ApiProperty({ example: 0 })
  totalWorkOrders!: number;

  @ApiProperty({ example: 6 })
  totalProjects!: number;

  @ApiProperty({ example: 12 })
  totalProducts!: number;

  @ApiProperty({ type: QuotesByStatusDto })
  quotesByStatus!: QuotesByStatusDto;

  @ApiProperty({ type: WorkOrdersByStatusDto })
  workOrdersByStatus!: WorkOrdersByStatusDto;
}
