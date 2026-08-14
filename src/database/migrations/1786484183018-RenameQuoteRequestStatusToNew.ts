import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameQuoteRequestStatusToNew1786484183018 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "quote_requests_status_enum" RENAME VALUE 'PENDING' TO 'NEW'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "quote_requests_status_enum" RENAME VALUE 'NEW' TO 'PENDING'`,
        );
    }
}
