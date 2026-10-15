using System.Net.Mail;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
namespace APH.SiteHub.Application.Accounts;

public sealed class CreateAccountHandler(IAccountRepository repository, ISecretProtector secrets) : IHandler<CreateAccountCommand, AccountResponse>
{
    public async Task<Result<AccountResponse>> HandleAsync(CreateAccountCommand command, CancellationToken ct)
    {
        var email = Normalize.Required(command.Email, "email");
        if (email.IsFailure)
        {
            return email.ToFailure<AccountResponse>();
        }
        if (!MailAddress.TryCreate(email.Value, out var address) || address.Address != email.Value || !email.Value.Contains('.'))
        {
            return Result<AccountResponse>.Failure(Error.Invalid("Invalid email"));
        }
        var provider = Normalize.Required(command.Provider, "provider");
        var login = Normalize.Required(command.LoginName, "login name");
        var externalId = Normalize.Required(command.ExternalAccountId, "external account ID");
        var password = AccountValidation.RequireSecret(command.Password, "password");
        var secret = AccountValidation.RequireSecret(command.SecretKey, "secret key");
        if (ResultValidation.FirstFailure(provider, login, externalId, password, secret) is { } error)
        {
            return Result<AccountResponse>.Failure(error);
        }
        var account = new Account
        {
            Provider = provider.Value,
            LoginName = login.Value,
            ExternalAccountId = externalId.Value,
            Email = email.Value,
            Password = password.Value,
            IsLimit = command.IsLimit,
            CreatedAt = command.CreatedAt?.ToUniversalTime() ?? DateTime.UtcNow
        };
        var encrypted = secrets.Encrypt(account.Id, secret.Value);
        if (encrypted.IsFailure)
        {
            return encrypted.ToFailure<AccountResponse>();
        }
        account.SecretKeyEncrypted = encrypted.Value;
        return await repository.CreateAsync(account, ct);
    }
}
