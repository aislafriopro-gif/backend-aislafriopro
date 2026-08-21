import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialsAndNullableServiceToQuoteRequests1787000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ADD "materials" text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "service_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "service_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP COLUMN "materials"`,
    );
  }
}
