using APH.SiteHub.Application;
using System.Linq.Expressions;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Application.Accounts;
using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class AccountRepository(SiteHubDbContext db, DatabaseOperation database) : IAccountRepository
{
    private static readonly Expression<Func<Account, AccountResponse>> PublicFields = x => new(x.Id, x.Provider, x.LoginName, x.ExternalAccountId, x.Email, x.IsLimit, x.CreatedAt);
    public Task<Result<List<AccountResponse>>> ListAsync(CancellationToken ct) => database.ExecuteAsync<List<AccountResponse>>(async () => Result<List<AccountResponse>>.Success(await db.Accounts.AsNoTracking().OrderBy(x => x.CreatedAt).Select(PublicFields).ToListAsync(ct)), ct);
    public Task<Result<AccountResponse?>> FindAsync(string id, CancellationToken ct) => database.ExecuteAsync<AccountResponse?>(async () => Result<AccountResponse?>.Success(await db.Accounts.AsNoTracking().Where(x => x.Id == id).Select(PublicFields).SingleOrDefaultAsync(ct)), ct);
    public Task<Result<AccountResponse>> CreateAsync(Account account, CancellationToken ct) => database.ExecuteAsync<AccountResponse>(async () =>
    {
        db.Accounts.Add(account);
        await db.SaveChangesAsync(ct);
        return Result<AccountResponse>.Success(AccountResponse.From(account));

    }, ct);
    public Task<Result<AccountResponse?>> UpdateAsync(string id, string? password, string? encryptedSecret, bool? limited, CancellationToken ct) => database.ExecuteAsync<AccountResponse?>(async () =>
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var affected = await db.Accounts.Where(x => x.Id == id).ExecuteUpdateAsync(s => s
            .SetProperty(x => x.Password, x => password ?? x.Password)
            .SetProperty(x => x.SecretKeyEncrypted, x => encryptedSecret ?? x.SecretKeyEncrypted)
            .SetProperty(x => x.IsLimit, x => limited ?? x.IsLimit), ct);
        if (affected == 0)
        {
            return Result<AccountResponse?>.Success(null);
        }
        var result = await db.Accounts.AsNoTracking().Where(x => x.Id == id).Select(PublicFields).SingleOrDefaultAsync(ct);
        await tx.CommitAsync(ct);
        return Result<AccountResponse?>.Success(result);

    }, ct);
    public Task<Result<string?>> SecretAsync(string id, CancellationToken ct) => database.ExecuteAsync<string?>(async () => Result<string?>.Success(await db.Accounts.AsNoTracking().Where(x => x.Id == id).Select(x => x.SecretKeyEncrypted).SingleOrDefaultAsync(ct)), ct);
    public Task<Result<bool>> DeleteAsync(string id, CancellationToken ct) => database.ExecuteAsync<bool>(async () => Result<bool>.Success(await db.Accounts.Where(x => x.Id == id).ExecuteDeleteAsync(ct) > 0), ct);
    public Task<Result<AccountStats>> StatsAsync(CancellationToken ct) => database.ExecuteAsync<AccountStats>(async () =>
    {
        var providers = await db.Accounts.GroupBy(x => x.Provider).OrderBy(x => x.Key)
            .Select(g => new ProviderStats(g.Key, g.Count(), g.Count(x => x.IsLimit), g.Count(x => !x.IsLimit))).ToArrayAsync(ct);
        return Result<AccountStats>.Success(new(providers.Sum(x => x.Total), providers.Sum(x => x.Limited), providers.Sum(x => x.Unlimited), providers));

    }, ct);
}
