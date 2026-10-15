using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
namespace APH.SiteHub.Application.Auth;

public sealed class AuthService(ICredentialRepository credentials, IPasswordHasher passwords)
{
    public Task<Result<AdminCredential>> CurrentAsync(CancellationToken ct) => credentials.CurrentAsync(ct);
    public async Task<Result<AdminCredential>> LoginAsync(string? password, CancellationToken ct)
    {
        var validated = Normalize.Password(password);
        if (validated.IsFailure)
        {
            return validated.ToFailure<AdminCredential>();
        }
        var current = await credentials.CurrentAsync(ct);
        return current.Bind(credential => passwords.Verify(validated.Value, credential.PasswordHash).Bind(matches => matches
            ? Result<AdminCredential>.Success(credential) : Result<AdminCredential>.Failure(Error.Unauthorized("Incorrect password"))));
    }
    public async Task<Result<AdminCredential>> ChangePasswordAsync(string? currentPassword, string? newPassword, string expectedVersion, CancellationToken ct)
    {
        var old = Normalize.Password(currentPassword);
        var next = Normalize.Password(newPassword, 12);
        if (ResultValidation.FirstFailure(old, next) is { } error)
        {
            return Result<AdminCredential>.Failure(error);
        }
        if (old.Value == next.Value)
        {
            return Result<AdminCredential>.Failure(Error.Invalid("New password must differ from the current password"));
        }
        var current = await credentials.CurrentAsync(ct);
        if (current.IsFailure)
        {
            return current;
        }
        if (current.Value.Version != expectedVersion)
        {
            return Result<AdminCredential>.Failure(Error.Unauthorized());
        }
        var verified = passwords.Verify(old.Value, current.Value.PasswordHash);
        if (verified.IsFailure)
        {
            return verified.ToFailure<AdminCredential>();
        }
        if (!verified.Value)
        {
            return Result<AdminCredential>.Failure(Error.Unauthorized("Incorrect current password"));
        }
        var hash = passwords.Hash(next.Value);
        if (hash.IsFailure)
        {
            return hash.ToFailure<AdminCredential>();
        }
        return (await credentials.ReplaceAsync(hash.Value, expectedVersion, ct)).Bind(updated => updated is null
            ? Result<AdminCredential>.Failure(Error.Conflict("The password was changed. Please try again")) : Result<AdminCredential>.Success(updated));
    }
}
