using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Application.Accounts;
using APH.SiteHub.Domain;
using Dapper;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class AccountRepository(DbSession session, DatabaseOperation database) : IAccountRepository
{
    private const string PublicColumns = "account_id AS id, provider, name AS login_name, external_account_id, email, is_limit, created_at";

    // is_limit is NUMBER(1) in Oracle; read it as an int and convert explicitly.
    private sealed class AccountRow
    {
        public string Id { get; set; } = "";
        public string Provider { get; set; } = "";
        public string LoginName { get; set; } = "";
        public string ExternalAccountId { get; set; } = "";
        public string Email { get; set; } = "";
        public int IsLimit { get; set; }
        public DateTime CreatedAt { get; set; }
        public AccountResponse ToResponse() => new(
            Id,
            Provider,
            LoginName,
            ExternalAccountId,
            Email,
            IsLimit != 0,
            DateTime.SpecifyKind(CreatedAt, DateTimeKind.Utc)
        );
    }
    private sealed class StatsRow
    {
        public string Provider { get; set; } = "";
        public int Total { get; set; }
        public int Limited { get; set; }
    }

    public Task<Result<List<AccountResponse>>> ListAsync(CancellationToken ct) => database.ExecuteAsync<List<AccountResponse>>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        var rows = await connection.QueryAsync<AccountRow>(Sql.Command($"SELECT {PublicColumns} FROM accounts ORDER BY created_at", null, null, ct));
        return Result<List<AccountResponse>>.Success(rows.Select(x => x.ToResponse()).ToList());

    }, ct);
    public Task<Result<AccountResponse?>> FindAsync(string id, CancellationToken ct) => database.ExecuteAsync<AccountResponse?>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        return Result<AccountResponse?>.Success(await FindRowAsync(connection, id, null, ct));

    }, ct);
    public Task<Result<AccountResponse>> CreateAsync(Account account, CancellationToken ct) => database.ExecuteAsync<AccountResponse>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        await connection.ExecuteAsync(Sql.Command(
            """
            INSERT INTO accounts (account_id, provider, name, external_account_id, email, password, secret_key_encrypted, is_limit, created_at)
            VALUES (:id, :provider, :loginName, :externalId, :email, :password, :secret, :isLimit, :createdAt)
            """,
            new
            {
                id = account.Id,
                provider = account.Provider,
                loginName = account.LoginName,
                externalId = account.ExternalAccountId,
                email = account.Email,
                password = account.Password,
                secret = account.SecretKeyEncrypted,
                isLimit = account.IsLimit ? 1 : 0,
                createdAt = account.CreatedAt
            },
            null,
            ct
        ));
        return Result<AccountResponse>.Success(AccountResponse.From(account));

    }, ct);
    public Task<Result<AccountResponse?>> UpdateAsync(
        string id,
        string? password,
        string? encryptedSecret,
        bool? limited,
        CancellationToken ct
    ) => database.ExecuteAsync<AccountResponse?>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        await using var tx = await connection.BeginTransactionAsync(ct);
        var affected = await connection.ExecuteAsync(Sql.Command(
            """
            UPDATE accounts SET password = COALESCE(:password, password),
              secret_key_encrypted = COALESCE(:secret, secret_key_encrypted),
              is_limit = COALESCE(:isLimit, is_limit)
            WHERE account_id = :id
            """,
            new { id, password, secret = encryptedSecret, isLimit = limited is null ? (int?)null : limited.Value ? 1 : 0 },
            tx,
            ct
        ));
        if (affected == 0)
        {
            return Result<AccountResponse?>.Success(null);
        }
        var result = await FindRowAsync(connection, id, tx, ct);
        await tx.CommitAsync(ct);
        return Result<AccountResponse?>.Success(result);

    }, ct);
    public Task<Result<string?>> SecretAsync(string id, CancellationToken ct) => database.ExecuteAsync<string?>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        return Result<string?>.Success(await connection.QuerySingleOrDefaultAsync<string>(Sql.Command("SELECT secret_key_encrypted FROM accounts WHERE account_id = :id", new { id }, null, ct)));

    }, ct);
    public Task<Result<bool>> DeleteAsync(string id, CancellationToken ct) => database.ExecuteAsync<bool>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        return Result<bool>.Success(await connection.ExecuteAsync(Sql.Command("DELETE FROM accounts WHERE account_id = :id", new { id }, null, ct)) > 0);

    }, ct);
    public Task<Result<AccountStats>> StatsAsync(CancellationToken ct) => database.ExecuteAsync<AccountStats>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        var rows = await connection.QueryAsync<StatsRow>(Sql.Command(
            "SELECT provider, COUNT(*) AS total, SUM(is_limit) AS limited FROM accounts GROUP BY provider ORDER BY provider",
            null,
            null,
            ct
        ));
        var providers = rows.Select(g => new ProviderStats(
            g.Provider,
            g.Total,
            g.Limited,
            g.Total - g.Limited
        )).ToArray();
        return Result<AccountStats>.Success(new(
            providers.Sum(x => x.Total),
            providers.Sum(x => x.Limited),
            providers.Sum(x => x.Unlimited),
            providers
        ));

    }, ct);

    private static async Task<AccountResponse?> FindRowAsync(
        System.Data.Common.DbConnection connection,
        string id,
        System.Data.Common.DbTransaction? tx,
        CancellationToken ct
    ) => (await connection.QuerySingleOrDefaultAsync<AccountRow>(Sql.Command($"SELECT {PublicColumns} FROM accounts WHERE account_id = :id", new { id }, tx, ct)))?.ToResponse();
}
