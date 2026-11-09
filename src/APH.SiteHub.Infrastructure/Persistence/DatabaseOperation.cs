using APH.SiteHub.Application;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class DatabaseOperation(ILogger<DatabaseOperation> logger)
{
    public const int UniqueViolation = 1;
    public const int ParentKeyNotFound = 2291;

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
            var number = FindOracle(exception)?.Number;
            if (Translate(number) is { } known)
            {
                return Result<T>.Failure(known);
            }
            logger.LogError(
                "Database operation failed with exception type {Type} and Oracle error {OraCode}",
                exception.GetType().Name,
                number
            );
            return Result<T>.Failure(Error.Unexpected());
        }
    }

    /// <summary>Maps constraint violations to client-safe errors; null means unexpected.</summary>
    public static Error? Translate(int? oracleError) => oracleError switch
    {
        UniqueViolation => Error.Conflict("A record with this name or provider/external ID already exists"),
        ParentKeyNotFound => Error.Invalid("One or more tags do not exist"),
        _ => null
    };

    private static OracleException? FindOracle(Exception exception) => exception is OracleException oracle ? oracle : exception.InnerException is { } inner ? FindOracle(inner) : null;
}
