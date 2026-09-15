import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuthFieldsToUsers1789435075924 implements MigrationInterface {
  name = 'AddGoogleAuthFieldsToUsers1789435075924';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_authprovider_enum" AS ENUM('LOCAL', 'GOOGLE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "authProvider" "public"."users_authprovider_enum" NOT NULL DEFAULT 'LOCAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "providerId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "providerId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "authProvider"`);
    await queryRunner.query(`DROP TYPE "public"."users_authprovider_enum"`);
  }
}
