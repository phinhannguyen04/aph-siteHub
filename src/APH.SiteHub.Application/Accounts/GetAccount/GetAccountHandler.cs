using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Accounts;

public sealed class GetAccountHandler(IAccountRepository repository) : IHandler<GetAccountQuery, AccountResponse>
{
    public async Task<Result<AccountResponse>> HandleAsync(GetAccountQuery query, CancellationToken ct) =>
        (await repository.FindAsync(query.Id, ct)).Bind(account => account is null
            ? Result<AccountResponse>.Failure(Error.Missing("Account")) : Result<AccountResponse>.Success(account));
}
