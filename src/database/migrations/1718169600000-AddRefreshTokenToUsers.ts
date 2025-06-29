import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenToUsers1718169600000 implements MigrationInterface {
  name = 'AddRefreshTokenToUsers1718169600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" VARCHAR`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
  }
}
