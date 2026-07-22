import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1784671433534 implements MigrationInterface {
    name = 'Migrations1784671433534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."audit_logs_action_enum" NOT NULL, "entityName" character varying(100) NOT NULL, "entityId" uuid, "userId" uuid, "previousData" jsonb, "newData" jsonb, "ipAddress" character varying(45), "userAgent" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0ec52f017ac513f07ee6e749e" ON "audit_logs" ("entityName", "entityId") `);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "slug" character varying(160) NOT NULL, "description" text NOT NULL, "shortDescription" character varying(300), "imageUrl" character varying(500), "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_02cf0d0f46e11d22d952f62367" ON "services" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_9c7f613a5de2270db74d471e21" ON "services" ("displayOrder") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d149e510fc4de20510200ed76" ON "services" ("isActive") `);
        await queryRunner.query(`CREATE TYPE "public"."site_settings_type_enum" AS ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON')`);
        await queryRunner.query(`CREATE TABLE "site_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(100) NOT NULL, "value" text, "type" "public"."site_settings_type_enum" NOT NULL, "description" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e71167433328a5afb90dda43da0" UNIQUE ("key"), CONSTRAINT "PK_e4290e8371a166d7e066d131f6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "faqs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" character varying(300) NOT NULL, "answer" text NOT NULL, "displayOrder" integer, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2ddf4f2c910f8e8fa2663a67bf0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d698e54bf8947407d6b5bd38b9" ON "faqs" ("displayOrder") `);
        await queryRunner.query(`CREATE INDEX "IDX_821beb737b3c154e7cbc83aff4" ON "faqs" ("isActive") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_821beb737b3c154e7cbc83aff4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d698e54bf8947407d6b5bd38b9"`);
        await queryRunner.query(`DROP TABLE "faqs"`);
        await queryRunner.query(`DROP TABLE "site_settings"`);
        await queryRunner.query(`DROP TYPE "public"."site_settings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d149e510fc4de20510200ed76"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c7f613a5de2270db74d471e21"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02cf0d0f46e11d22d952f62367"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0ec52f017ac513f07ee6e749e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    }

}
