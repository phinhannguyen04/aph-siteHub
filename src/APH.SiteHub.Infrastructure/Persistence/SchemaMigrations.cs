namespace APH.SiteHub.Infrastructure.Persistence;

/// <summary>Ordered, append-only schema steps. One SQL statement per entry (no trailing semicolon).</summary>
internal static class SchemaMigrations
{
    // Lengths mirror application validation. Timestamps for tags/websites stay ISO-8601 text.
    public static readonly IReadOnlyList<(string Id, string[] Statements)> All =
    [
        ("20261125000000_InitialPostgresSchema",
        [
            """
            CREATE TABLE IF NOT EXISTS tags (
              tag_id varchar(36) PRIMARY KEY,
              name varchar(64) NOT NULL,
              name_key varchar(64) NOT NULL,
              description varchar(240) NOT NULL DEFAULT '',
              color varchar(7) NOT NULL,
              created_at varchar(30) NOT NULL,
              updated_at varchar(30) NOT NULL
            )
            """,
            "CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key_unique ON tags (name_key)",
            """
            CREATE TABLE IF NOT EXISTS websites (
              website_id varchar(36) PRIMARY KEY,
              name varchar(160) NOT NULL,
              url varchar(2048) NOT NULL,
              search_text text NOT NULL,
              created_at varchar(30) NOT NULL,
              updated_at varchar(30) NOT NULL
            )
            """,
            "CREATE INDEX IF NOT EXISTS websites_created_id_idx ON websites (created_at, website_id)",
            """
            CREATE TABLE IF NOT EXISTS website_tags (
              website_id varchar(36) NOT NULL REFERENCES websites (website_id) ON DELETE CASCADE,
              tag_id varchar(36) NOT NULL REFERENCES tags (tag_id) ON DELETE CASCADE,
              position integer NOT NULL,
              PRIMARY KEY (website_id, tag_id)
            )
            """,
            "CREATE INDEX IF NOT EXISTS website_tags_tag_idx ON website_tags (tag_id)",
            """
            CREATE TABLE IF NOT EXISTS accounts (
              account_id varchar(36) PRIMARY KEY,
              provider varchar(128) NOT NULL,
              name varchar(256) NOT NULL,
              external_account_id varchar(256) NOT NULL,
              email varchar(320) NOT NULL,
              password varchar(1024) NOT NULL,
              secret_key_encrypted text NOT NULL,
              is_limit boolean NOT NULL DEFAULT false,
              created_at timestamptz NOT NULL
            )
            """,
            "CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_external_id_unique ON accounts (provider, external_account_id)"
        ])
    ];
}
