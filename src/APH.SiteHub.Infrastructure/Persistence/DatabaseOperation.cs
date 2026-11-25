using APH.SiteHub.Application;
using Microsoft.Extensions.Logging;
using Npgsql;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class DatabaseOperation(ILogger<DatabaseOperation> logger)
{
    public const string UniqueViolation = PostgresErrorCodes.UniqueViolation;
    public const string ForeignKeyViolation = PostgresErrorCodes.ForeignKeyViolation;

    // Catch only at the driver boundary, after transaction scopes have rolled back/disposed.
    public async Task<Result<T>> ExecuteAsync<T>(Func<Task<Result<T>>> operation, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        try
        {
            return await operation();
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception exception)
        {
            var code = FindPostgres(exception)?.SqlState;
            if (Translate(code) is { } known)
            {
                return Result<T>.Failure(known);
            }
            logger.LogError(
                "Database operation failed with exception type {Type} and SQLSTATE {SqlState}",
                exception.GetType().Name,
                code
            );
            return Result<T>.Failure(Error.Unexpected());
        }
    }

    /// <summary>Maps constraint violations to client-safe errors; null means unexpected.</summary>
    public static Error? Translate(string? sqlState) => sqlState switch
    {
        UniqueViolation => Error.Conflict("A record with this name or provider/external ID already exists"),
        ForeignKeyViolation => Error.Invalid("One or more tags do not exist"),
        _ => null
    };

    private static PostgresException? FindPostgres(Exception exception) => exception is PostgresException postgres ? postgres : exception.InnerException is { } inner ? FindPostgres(inner) : null;
}
