import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaEntity1786467546989 implements MigrationInterface {
  name = 'CreateMediaEntity1786467546989';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "publicId" character varying(255) NOT NULL, "url" character varying(500) NOT NULL, "secureUrl" character varying(500) NOT NULL, "format" character varying(50) NOT NULL, "resourceType" character varying(50) NOT NULL, "width" integer, "height" integer, "bytes" integer NOT NULL, "originalName" character varying(255), "uploadedById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4974d31d47717ebefc8b613eb2" ON "media" ("uploadedById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c35814df0321f3e81d11dae2c" ON "media" ("resourceType") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d1c934b93ad5ea81456fc1f304" ON "media" ("publicId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD CONSTRAINT "FK_4974d31d47717ebefc8b613eb27" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT "FK_4974d31d47717ebefc8b613eb27"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1c934b93ad5ea81456fc1f304"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c35814df0321f3e81d11dae2c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4974d31d47717ebefc8b613eb2"`,
    );
    await queryRunner.query(`DROP TABLE "media"`);
  }
}
