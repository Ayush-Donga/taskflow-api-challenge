import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskIndexes1718263200000 implements MigrationInterface {
  name = 'AddTaskIndexes1718263200000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_task_user_id ON tasks (user_id);
      CREATE INDEX idx_task_status ON tasks (status);
      CREATE INDEX idx_task_due_date ON tasks (due_date);
      CREATE INDEX idx_task_priority ON tasks (priority);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX idx_task_user_id;
      DROP INDEX idx_task_status;
      DROP INDEX idx_task_due_date;
      DROP INDEX idx_task_priority;
    `);
  }
}
