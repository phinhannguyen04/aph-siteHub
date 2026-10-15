using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Accounts;

public sealed class ListAccountsHandler(IAccountRepository repository) : IHandler<ListAccountsQuery, List<AccountResponse>>
{
    public Task<Result<List<AccountResponse>>> HandleAsync(ListAccountsQuery query, CancellationToken ct) => repository.ListAsync(ct);
}
