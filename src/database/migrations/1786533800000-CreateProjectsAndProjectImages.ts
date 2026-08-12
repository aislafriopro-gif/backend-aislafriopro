import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectsAndProjectImages1786533800000 implements MigrationInterface {
    name = 'CreateProjectsAndProjectImages1786533800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."project_images_type_enum" AS ENUM('BEFORE', 'AFTER')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "slug" character varying(160) NOT NULL, "description" text NOT NULL, "location" character varying(255), "completionDate" date, "clientId" uuid, "clientDisplayName" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_projects_slug_active" ON "projects" ("slug") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE TABLE "project_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "url" character varying(500) NOT NULL, "publicId" character varying(500) NOT NULL, "type" "public"."project_images_type_enum" NOT NULL, "displayOrder" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5d8a6e8a46a5dc4fc7f5b6b7b74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_services" ("projectId" uuid NOT NULL, "serviceId" uuid NOT NULL, CONSTRAINT "PK_project_services" PRIMARY KEY ("projectId", "serviceId"))`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_clientId" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_images" ADD CONSTRAINT "FK_project_images_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_services" ADD CONSTRAINT "FK_project_services_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_services" ADD CONSTRAINT "FK_project_services_serviceId" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_services" DROP CONSTRAINT "FK_project_services_serviceId"`);
        await queryRunner.query(`ALTER TABLE "project_services" DROP CONSTRAINT "FK_project_services_projectId"`);
        await queryRunner.query(`ALTER TABLE "project_images" DROP CONSTRAINT "FK_project_images_projectId"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_clientId"`);
        await queryRunner.query(`DROP TABLE "project_services"`);
        await queryRunner.query(`DROP TABLE "project_images"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_projects_slug_active"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."project_images_type_enum"`);
    }

}
