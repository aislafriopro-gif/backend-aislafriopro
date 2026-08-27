import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductInquiries1787769761890 implements MigrationInterface {
  name = 'CreateProductInquiries1787769761890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_inquiries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(50) NOT NULL, "productId" uuid NOT NULL, "message" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_product_inquiries_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_inquiries_productId" ON "product_inquiries" ("productId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_inquiries" ADD CONSTRAINT "FK_product_inquiries_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_inquiries" DROP CONSTRAINT "FK_product_inquiries_productId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_inquiries_productId"`,
    );
    await queryRunner.query(`DROP TABLE "product_inquiries"`);
  }
}
