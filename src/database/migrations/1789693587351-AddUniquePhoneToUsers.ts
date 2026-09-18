import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniquePhoneToUsers1789693587351 implements MigrationInterface {
  name = 'AddUniquePhoneToUsers1789693587351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Si existen registros duplicados previos a la restricción, conservamos el más reciente y limpiamos los anteriores
    await queryRunner.query(`
      UPDATE users
      SET phone = NULL
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt" DESC, id DESC) AS rn
          FROM users
          WHERE phone IS NOT NULL
        ) dup
        WHERE dup.rn > 1
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_users_phone"`);
  }
}
