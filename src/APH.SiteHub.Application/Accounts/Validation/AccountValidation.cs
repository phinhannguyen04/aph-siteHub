namespace APH.SiteHub.Application.Accounts;

internal static class AccountValidation
{
    internal static Result<string> RequireSecret(string? value, string name) => string.IsNullOrWhiteSpace(value)
        ? Result<string>.Failure(Error.Invalid($"Invalid {name}")) : Result<string>.Success(value);
}
