using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace APH.SiteHub.Infrastructure.Persistence.Migrations;

/// <summary>Adopt the TypeORM-era schema without rewriting rows or previous migration history.</summary>
public partial class AdoptExistingPostgresSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
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
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        throw new NotSupportedException("Schema adoption cannot be reverted by dropping existing SiteHub data. Restore a verified backup explicitly.");
    }
}
