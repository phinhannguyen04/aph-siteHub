namespace APH.SiteHub.Infrastructure.Persistence;

/// <summary>Ordered, append-only schema steps. One SQL statement per entry (no trailing semicolon).</summary>
internal static class SchemaMigrations
{
    // Oracle treats '' as NULL, so only columns that may legitimately be empty (tags.description) are nullable.
    // Lengths mirror application validation; every string is VARCHAR2 within the 4000-byte limit.
    public static readonly IReadOnlyList<(string Id, string[] Statements)> All =
    [
        ("20261101000000_InitialOracleSchema",
        [
            """
            CREATE TABLE IF NOT EXISTS admin_credentials (
              id VARCHAR2(32) NOT NULL,
              password_hash VARCHAR2(1024) NOT NULL,
              version VARCHAR2(64) NOT NULL,
              CONSTRAINT admin_credentials_pk PRIMARY KEY (id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS tags (
              tag_id VARCHAR2(36) NOT NULL,
              name VARCHAR2(64 CHAR) NOT NULL,
              name_key VARCHAR2(64 CHAR) NOT NULL,
              description VARCHAR2(240 CHAR),
              color VARCHAR2(7) NOT NULL,
              created_at VARCHAR2(30) NOT NULL,
              updated_at VARCHAR2(30) NOT NULL,
              CONSTRAINT tags_pk PRIMARY KEY (tag_id)
            )
            """,
            "CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key_unique ON tags (name_key)",
            """
            CREATE TABLE IF NOT EXISTS websites (
              website_id VARCHAR2(36) NOT NULL,
              name VARCHAR2(160 CHAR) NOT NULL,
              url VARCHAR2(2048) NOT NULL,
              search_text VARCHAR2(4000) NOT NULL,
              created_at VARCHAR2(30) NOT NULL,
              updated_at VARCHAR2(30) NOT NULL,
              CONSTRAINT websites_pk PRIMARY KEY (website_id)
            )
            """,
            "CREATE INDEX IF NOT EXISTS websites_created_id_idx ON websites (created_at, website_id)",
            """
            CREATE TABLE IF NOT EXISTS website_tags (
              website_id VARCHAR2(36) NOT NULL,
              tag_id VARCHAR2(36) NOT NULL,
              position NUMBER(10) NOT NULL,
              CONSTRAINT website_tags_pk PRIMARY KEY (website_id, tag_id),
              CONSTRAINT website_tags_website_fk FOREIGN KEY (website_id) REFERENCES websites (website_id) ON DELETE CASCADE,
              CONSTRAINT website_tags_tag_fk FOREIGN KEY (tag_id) REFERENCES tags (tag_id) ON DELETE CASCADE
            )
            """,
            "CREATE INDEX IF NOT EXISTS website_tags_tag_idx ON website_tags (tag_id)",
            """
            CREATE TABLE IF NOT EXISTS accounts (
              account_id VARCHAR2(36) NOT NULL,
              provider VARCHAR2(128 CHAR) NOT NULL,
              name VARCHAR2(256 CHAR) NOT NULL,
              external_account_id VARCHAR2(256 CHAR) NOT NULL,
              email VARCHAR2(320 CHAR) NOT NULL,
              password VARCHAR2(1024 CHAR) NOT NULL,
              secret_key_encrypted VARCHAR2(4000) NOT NULL,
              is_limit NUMBER(1) DEFAULT 0 NOT NULL,
              created_at TIMESTAMP(6) NOT NULL,
              CONSTRAINT accounts_pk PRIMARY KEY (account_id),
              CONSTRAINT accounts_is_limit_ck CHECK (is_limit IN (0, 1))
            )
            """,
            "CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_external_id_unique ON accounts (provider, external_account_id)"
        ])
    ];
}
