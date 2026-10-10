using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Accounts;

public sealed class GetAccountSecretHandler(IAccountRepository repository, ISecretProtector secrets) : IHandler<GetAccountSecretQuery, string>
{
    public async Task<Result<string>> HandleAsync(GetAccountSecretQuery query, CancellationToken ct) =>
        (await repository.SecretAsync(query.Id, ct)).Bind(envelope => envelope is null
            ? Result<string>.Failure(Error.Missing("Account")) : secrets.Decrypt(query.Id, envelope));
}
