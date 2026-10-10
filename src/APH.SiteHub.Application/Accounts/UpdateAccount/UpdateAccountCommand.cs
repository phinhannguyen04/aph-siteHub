namespace APH.SiteHub.Application.Accounts;

public sealed record UpdateAccountCommand(string Id, string? Password, string? SecretKey, bool? IsLimit);
