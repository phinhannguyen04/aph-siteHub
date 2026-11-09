using APH.SiteHub.Domain;

namespace APH.SiteHub.Application.Abstractions;

public interface ICredentialRepository
{
    Task<Result<AdminCredential>> CurrentAsync(CancellationToken ct);
    Task<Result<AdminCredential?>> ReplaceAsync(
        string passwordHash,
        string expectedVersion,
        CancellationToken ct
    );
    /// <summary>Creates or overwrites the administrator credential and rotates its version (revokes sessions).</summary>
    Task<Result<bool>> ForceSetAsync(string passwordHash, CancellationToken ct);
}
