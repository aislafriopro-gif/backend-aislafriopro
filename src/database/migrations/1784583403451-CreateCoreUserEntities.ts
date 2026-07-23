import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784583403451 implements MigrationInterface {
    name = 'InitialSchema1784583403451'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."roles_name_enum" AS ENUM('ADMIN', 'USER', 'CLIENT', 'TECHNICIAN')
        `);
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" "public"."roles_name_enum" NOT NULL DEFAULT 'USER',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_roles_name_active" ON "roles" ("name") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "refreshToken" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, "ipAddress" character varying NOT NULL, "userAgent" character varying NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "userId" uuid, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "role_id" uuid NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email_active" ON "users" ("email") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_users_email_active"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_roles_name_active"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "roles"`);

        await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
    }

}
