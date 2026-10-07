import type { MigrationInterface, QueryRunner } from 'typeorm'

export class Accounts1791244800000 implements MigrationInterface {
  /**
   * Create the accounts table and enforce uniqueness of each provider and external
   * account ID pair.
   */
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id text PRIMARY KEY NOT NULL,
        provider text NOT NULL,
        name text NOT NULL,
        external_account_id text NOT NULL,
        email text NOT NULL,
        password text NOT NULL,
        secret_key_encrypted text NOT NULL,
        is_limit boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_external_id_unique
        ON accounts (provider, external_account_id);
    `)
  }

  /** Remove the accounts table and all account records when reverting this migration. */
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE accounts')
  }
}
