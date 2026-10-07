import type { MigrationInterface, QueryRunner } from 'typeorm'

/** Adopt the existing PostgreSQL schema without altering existing records. */
export class InitialSchema1791158400000 implements MigrationInterface {
  /** Create missing core tables and indexes while preserving existing tables and records. */
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id text PRIMARY KEY NOT NULL, password_hash text NOT NULL, version text NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tags (
        tag_id text PRIMARY KEY NOT NULL, name text NOT NULL, name_key text NOT NULL,
        description text NOT NULL, color text NOT NULL, created_at text NOT NULL, updated_at text NOT NULL
      );
      CREATE TABLE IF NOT EXISTS websites (
        website_id text PRIMARY KEY NOT NULL, name text NOT NULL, url text NOT NULL,
        search_text text NOT NULL, created_at text NOT NULL, updated_at text NOT NULL
      );
      CREATE TABLE IF NOT EXISTS website_tags (
        website_id text NOT NULL, tag_id text NOT NULL, position integer NOT NULL,
        CONSTRAINT website_tags_website_id_tag_id_pk PRIMARY KEY (website_id, tag_id),
        CONSTRAINT website_tags_website_id_websites_website_id_fk FOREIGN KEY (website_id) REFERENCES websites(website_id) ON DELETE CASCADE,
        CONSTRAINT website_tags_tag_id_tags_tag_id_fk FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key_unique ON tags (name_key);
      CREATE INDEX IF NOT EXISTS website_tags_tag_idx ON website_tags (tag_id);
      CREATE INDEX IF NOT EXISTS websites_created_id_idx ON websites (created_at, website_id);
    `)
  }

  /** Remove the core tables created by this migration, including their stored records. */
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE website_tags, websites, tags, admin_credentials')
  }
}
