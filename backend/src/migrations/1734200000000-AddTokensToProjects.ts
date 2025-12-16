import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTokensToProjects1734200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'githubToken',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'gitlabToken',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'discordBotToken',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('projects', 'discordBotToken');
    await queryRunner.dropColumn('projects', 'gitlabToken');
    await queryRunner.dropColumn('projects', 'githubToken');
  }
}
