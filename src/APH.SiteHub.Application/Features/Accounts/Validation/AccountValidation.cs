namespace APH.SiteHub.Application.Accounts;

internal static class AccountValidation
{
    // Limits mirror the Oracle column sizes (VARCHAR2 is capped at 4000 bytes).
    internal const int MaxPassword = 256;
    internal const int MaxSecretKey = 1024;
    internal const int MaxProvider = 128;
    internal const int MaxLoginName = 256;
    internal const int MaxExternalAccountId = 256;
    internal const int MaxEmail = 320;

    internal static Result<string> RequireSecret(string? value, string name, int max) => string.IsNullOrWhiteSpace(value) || value.Length > max
        ? Result<string>.Failure(Error.Invalid($"Invalid {name}")) : Result<string>.Success(value);
}
