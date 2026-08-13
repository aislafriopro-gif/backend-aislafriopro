import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoverAndMediaToProjectImages1786587240761 implements MigrationInterface {
  name = 'AddCoverAndMediaToProjectImages1786587240761';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."project_images_type_enum" ADD VALUE 'COVER'`,
    );
    await queryRunner.query(`ALTER TABLE "project_images" ADD "mediaId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "project_images" ADD CONSTRAINT "FK_project_images_mediaId" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "project_images" DROP COLUMN "url"`);
    await queryRunner.query(
      `ALTER TABLE "project_images" DROP COLUMN "publicId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_images" ADD "publicId" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_images" ADD "url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_images" DROP CONSTRAINT "FK_project_images_mediaId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_images" DROP COLUMN "mediaId"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."project_images_type_enum" RENAME TO "project_images_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_images_type_enum" AS ENUM('BEFORE', 'AFTER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_images" ALTER COLUMN "type" TYPE "public"."project_images_type_enum" USING "type"::text::"public"."project_images_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."project_images_type_enum_old"`,
    );
  }
}
