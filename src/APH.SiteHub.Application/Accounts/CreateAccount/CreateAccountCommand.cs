namespace APH.SiteHub.Application.Accounts;

public sealed record CreateAccountCommand(string? Provider, string? LoginName, string? ExternalAccountId, string? Email, string? Password, string? SecretKey, bool IsLimit = false, DateTime? CreatedAt = null);
