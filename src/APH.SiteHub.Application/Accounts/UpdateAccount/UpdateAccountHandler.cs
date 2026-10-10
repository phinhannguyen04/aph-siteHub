using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Accounts;

public sealed class UpdateAccountHandler(IAccountRepository repository, ISecretProtector secrets) : IHandler<UpdateAccountCommand, AccountResponse>
{
    public async Task<Result<AccountResponse>> HandleAsync(UpdateAccountCommand command, CancellationToken ct)
    {
        if (command.Password is null && command.SecretKey is null && command.IsLimit is null)
        {
            return Result<AccountResponse>.Failure(Error.Invalid("Provide at least one account field to update"));
        }
        var password = command.Password is null ? Result<string?>.Success(null) : AccountValidation.RequireSecret(command.Password, "password").Map(value => (string?)value);
        var secret = command.SecretKey is null ? Result<string?>.Success(null) : AccountValidation.RequireSecret(command.SecretKey, "secret key")
            .Bind(value => secrets.Encrypt(command.Id, value)).Map(value => (string?)value);
        if (ResultValidation.FirstFailure(password, secret) is { } error)
        {
            return Result<AccountResponse>.Failure(error);
        }
        return (await repository.UpdateAsync(command.Id, password.Value, secret.Value, command.IsLimit, ct)).Bind(account => account is null
            ? Result<AccountResponse>.Failure(Error.Missing("Account")) : Result<AccountResponse>.Success(account));
    }
}
