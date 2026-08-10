import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuoteRequestEntities1786394609781 implements MigrationInterface {
    name = 'CreateQuoteRequestEntities1786394609781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."quote_requests_status_enum" AS ENUM('PENDING', 'IN_REVIEW', 'RESPONDED', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "quote_requests" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying(150) NOT NULL,
            "email" character varying(255) NOT NULL,
            "phone" character varying(50) NOT NULL,
            "service_id" uuid NOT NULL,
            "message" text NOT NULL,
            "status" "public"."quote_requests_status_enum" NOT NULL DEFAULT 'PENDING',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_quote_requests_id" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_quote_requests_status" ON "quote_requests" ("status")`);
        await queryRunner.query(`CREATE TABLE "quote_request_notes" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "quote_request_id" uuid NOT NULL,
            "note" text NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_quote_request_notes_id" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ADD CONSTRAINT "FK_quote_requests_service_id" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_request_notes" ADD CONSTRAINT "FK_quote_request_notes_quote_request_id" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quote_request_notes" DROP CONSTRAINT "FK_quote_request_notes_quote_request_id"`);
        await queryRunner.query(`ALTER TABLE "quote_requests" DROP CONSTRAINT "FK_quote_requests_service_id"`);
        await queryRunner.query(`DROP TABLE "quote_request_notes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quote_requests_status"`);
        await queryRunner.query(`DROP TABLE "quote_requests"`);
        await queryRunner.query(`DROP TYPE "public"."quote_requests_status_enum"`);
    }
}
