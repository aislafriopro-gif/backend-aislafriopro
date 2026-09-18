import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniquePhoneToUsers1789693587351 implements MigrationInterface {
  name = 'AddUniquePhoneToUsers1789693587351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_users_phone"`);
  }
}
