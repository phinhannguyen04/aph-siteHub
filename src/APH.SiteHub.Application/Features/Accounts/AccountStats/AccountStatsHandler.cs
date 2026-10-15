using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Accounts;

public sealed class AccountStatsHandler(IAccountRepository repository) : IHandler<AccountStatsQuery, AccountStats>
{
    public Task<Result<AccountStats>> HandleAsync(AccountStatsQuery query, CancellationToken ct) => repository.StatsAsync(ct);
}
