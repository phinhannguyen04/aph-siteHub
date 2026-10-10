using APH.SiteHub.Domain;
namespace APH.SiteHub.Application.Accounts;

public sealed record AccountResponse(string Id, string Provider, string LoginName, string ExternalAccountId, string Email, bool IsLimit, DateTime CreatedAt)
{
    public static AccountResponse From(Account account) => new(account.Id, account.Provider, account.LoginName, account.ExternalAccountId, account.Email, account.IsLimit, account.CreatedAt);
}
