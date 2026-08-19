import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateQuoteRequestStatusEnum1787082197147 implements MigrationInterface {
  name = 'UpdateQuoteRequestStatusEnum1787082197147';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear el nuevo enum con los estados finales
    await queryRunner.query(
      `CREATE TYPE "public"."quote_requests_status_enum_new" AS ENUM('NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')`,
    );

    // 2. Quitar el default temporalmente para poder cambiar el tipo de columna
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" DROP DEFAULT`,
    );

    // 3. Convertir la columna a texto para permitir valores intermedios
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" TYPE text USING "status"::text`,
    );

    // 4. Mapear valores antiguos a nuevos estados
    await queryRunner.query(
      `UPDATE "quote_requests" SET "status" = 'IN_PROGRESS' WHERE "status" = 'IN_REVIEW'`,
    );
    await queryRunner.query(
      `UPDATE "quote_requests" SET "status" = 'RESOLVED' WHERE "status" = 'RESPONDED'`,
    );
    await queryRunner.query(
      `UPDATE "quote_requests" SET "status" = 'REJECTED' WHERE "status" = 'CLOSED'`,
    );

    // 5. Fallback: cualquier valor inesperado pasa a NEW
    await queryRunner.query(
      `UPDATE "quote_requests" SET "status" = 'NEW' WHERE "status" NOT IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')`,
    );

    // 6. Convertir la columna al nuevo enum
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" TYPE "public"."quote_requests_status_enum_new" USING "status"::"public"."quote_requests_status_enum_new"`,
    );

    // 7. Restaurar el default
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" SET DEFAULT 'NEW'`,
    );

    // 8. Eliminar el enum antiguo
    await queryRunner.query(`DROP TYPE "public"."quote_requests_status_enum"`);

    // 9. Renombrar el enum temporal al nombre original
    await queryRunner.query(
      `ALTER TYPE "public"."quote_requests_status_enum_new" RENAME TO "quote_requests_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear el enum antiguo
    await queryRunner.query(
      `CREATE TYPE "public"."quote_requests_status_enum_old" AS ENUM('NEW', 'IN_REVIEW', 'RESPONDED', 'CLOSED')`,
    );

    // 2. Quitar el default
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" DROP DEFAULT`,
    );

    // 3. Convertir la columna a texto
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" TYPE text USING "status"::text`,
    );

    // 4. Revertir el mapeo de valores
    await queryRunner.query(
      `UPDATE "quote_requests" SET "status" = 'IN_REVIEW' WHERE "status" = 'IN_PROGRESS'`,
    );
    await queryRunner.query(
      `UPDATE "quote_requests" SET "status" = 'RESPONDED' WHERE "status" = 'RESOLVED'`,
    );
    await queryRunner.query(
      `UPDATE "quote_requests" SET "status" = 'CLOSED' WHERE "status" = 'REJECTED'`,
    );

    // 5. Convertir la columna al enum antiguo
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" TYPE "public"."quote_requests_status_enum_old" USING "status"::"public"."quote_requests_status_enum_old"`,
    );

    // 6. Restaurar el default
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ALTER COLUMN "status" SET DEFAULT 'NEW'`,
    );

    // 7. Eliminar el enum nuevo
    await queryRunner.query(`DROP TYPE "public"."quote_requests_status_enum"`);

    // 8. Renombrar el enum antiguo al nombre original
    await queryRunner.query(
      `ALTER TYPE "public"."quote_requests_status_enum_old" RENAME TO "quote_requests_status_enum"`,
    );
  }
}
