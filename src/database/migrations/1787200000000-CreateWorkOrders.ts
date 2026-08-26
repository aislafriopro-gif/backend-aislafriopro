import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrders1787200000000 implements MigrationInterface {
  name = 'CreateWorkOrders1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."work_orders_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_id" uuid NOT NULL, "technician_id" uuid, "quote_request_id" uuid, "status" "public"."work_orders_status_enum" NOT NULL DEFAULT 'PENDING', "workDone" text, "observations" text, "materials" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_work_orders_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_client_id" ON "work_orders" ("client_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_technician_id" ON "work_orders" ("technician_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_status" ON "work_orders" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_work_orders_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_work_orders_technician" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_work_orders_quote_request" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "FK_work_orders_quote_request"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "FK_work_orders_technician"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "FK_work_orders_client"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_work_orders_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_work_orders_technician_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_work_orders_client_id"`);
    await queryRunner.query(`DROP TABLE "work_orders"`);
    await queryRunner.query(`DROP TYPE "public"."work_orders_status_enum"`);
  }
}