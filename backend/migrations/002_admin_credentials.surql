DEFINE TABLE IF NOT EXISTS admin_credentials SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS password_hash ON TABLE admin_credentials TYPE string;
DEFINE FIELD IF NOT EXISTS version ON TABLE admin_credentials TYPE string;
