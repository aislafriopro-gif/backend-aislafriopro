import { MigrationInterface, QueryRunner } from 'typeorm';

export class PointProjectsClientIdToClients1788000000000
  implements MigrationInterface
{
  name = 'PointProjectsClientIdToClients1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_clientId"',
    );
    await queryRunner.query(
      'ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_clientId"',
    );
    await queryRunner.query(
      'ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_clientId" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
    );
  }
}
