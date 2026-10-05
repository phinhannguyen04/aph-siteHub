import { Account } from "./account.interface";

export function toAccount(row: Account): Account {
    return {
        id: row.id,
        provider: row.provider,
        login_name: row.login_name,
        external_account_id: row.external_account_id,
        email: row.email,
        password: row.password,
        secret_key_encrypted: row.external_account_id,
        is_limit: row.is_limit,
        created_at: row.created_at
    }
}