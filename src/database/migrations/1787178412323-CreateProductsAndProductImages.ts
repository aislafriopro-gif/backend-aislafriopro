import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsAndProductImages1787178412323 implements MigrationInterface {
  name = 'CreateProductsAndProductImages1787178412323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "mediaId" uuid, "displayOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(160) NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "status" "public"."products_status_enum" NOT NULL DEFAULT 'ACTIVE', "isPublished" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_products_slug_active" ON "products" ("slug") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_b367708bf720c8dd62fc6833161" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_76c1302dd52d6e3560c7c8331d9" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_76c1302dd52d6e3560c7c8331d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_b367708bf720c8dd62fc6833161"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_products_slug_active"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
  }
}
