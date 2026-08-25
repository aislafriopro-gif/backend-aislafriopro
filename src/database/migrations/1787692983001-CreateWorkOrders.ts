import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrders1787692983001 implements MigrationInterface {
  name = 'CreateWorkOrders1787692983001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."work_orders_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid NOT NULL, "technicianId" uuid, "quoteRequestId" uuid, "status" "public"."work_orders_status_enum" NOT NULL DEFAULT 'PENDING', "workDone" text, "observations" text, "materials" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_work_orders_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_work_orders_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_work_orders_technicianId" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_work_orders_quoteRequestId" FOREIGN KEY ("quoteRequestId") REFERENCES "quote_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "work_orders" DROP CONSTRAINT "FK_work_orders_quoteRequestId"`);
    await queryRunner.query(`ALTER TABLE "work_orders" DROP CONSTRAINT "FK_work_orders_technicianId"`);
    await queryRunner.query(`ALTER TABLE "work_orders" DROP CONSTRAINT "FK_work_orders_clientId"`);
    await queryRunner.query(`DROP TABLE "work_orders"`);
    await queryRunner.query(`DROP TYPE "public"."work_orders_status_enum"`);
  }
}