import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrderImages1787771356073 implements MigrationInterface {
  name = 'CreateWorkOrderImages1787771356073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "work_order_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workOrderId" uuid NOT NULL, "url" character varying(500) NOT NULL, "publicId" character varying(500) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c48db424be2cc67180c08c08225" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_images" ADD CONSTRAINT "FK_48920b680b025d7750971fefa14" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_order_images_workOrderId" ON "work_order_images" ("workOrderId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_work_order_images_workOrderId"`);
    await queryRunner.query(
      `ALTER TABLE "work_order_images" DROP CONSTRAINT "FK_48920b680b025d7750971fefa14"`,
    );
    await queryRunner.query(`DROP TABLE "work_order_images"`);
  }
}
