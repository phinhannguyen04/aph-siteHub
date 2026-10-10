using APH.SiteHub.Application;
using Microsoft.Extensions.Logging;
using Npgsql;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class DatabaseOperation(ILogger<DatabaseOperation> logger)
{
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
            var pg = FindPostgres(exception);
            if (pg?.SqlState == "23505")
            {
                return Result<T>.Failure(Error.Conflict("A record with this name or provider/external ID already exists"));
            }
            if (pg?.SqlState == "23503")
            {
                return Result<T>.Failure(Error.Invalid("One or more tags do not exist"));
            }
            logger.LogError("Database operation failed with exception type {Type} and SQL state {SqlState}", exception.GetType().Name, pg?.SqlState);
            return Result<T>.Failure(Error.Unexpected());
        }
    }
    private static PostgresException? FindPostgres(Exception exception) => exception is PostgresException pg ? pg : exception.InnerException is { } inner ? FindPostgres(inner) : null;
}
