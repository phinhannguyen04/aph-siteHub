using APH.SiteHub.Domain;
using APH.SiteHub.Application.Accounts;

namespace APH.SiteHub.Application.Abstractions;

public interface IAccountRepository
{
    Task<Result<List<AccountResponse>>> ListAsync(CancellationToken ct);
    Task<Result<AccountResponse?>> FindAsync(string id, CancellationToken ct);
    Task<Result<AccountResponse>> CreateAsync(Account account, CancellationToken ct);
    Task<Result<AccountResponse?>> UpdateAsync(string id, string? password, string? encryptedSecret, bool? limited, CancellationToken ct);
    Task<Result<string?>> SecretAsync(string id, CancellationToken ct);
    Task<Result<bool>> DeleteAsync(string id, CancellationToken ct);
    Task<Result<AccountStats>> StatsAsync(CancellationToken ct);
}
