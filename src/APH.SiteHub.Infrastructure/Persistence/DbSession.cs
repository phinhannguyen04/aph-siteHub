using Oracle.ManagedDataAccess.Client;
namespace APH.SiteHub.Infrastructure.Persistence;

/// <summary>One lazily opened Oracle connection per request/scope (pooled by ODP.NET).</summary>
public sealed class DbSession(SiteHubOptions options) : IAsyncDisposable
{
    private OracleConnection? connection;
    public async Task<OracleConnection> OpenAsync(CancellationToken ct)
    {
        connection ??= new OracleConnection(options.ConnectionString);
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }
        return connection;
    }
    public async Task<bool> PingAsync(CancellationToken ct)
    {
        var open = await OpenAsync(ct);
        await using var command = open.CreateCommand();
        command.CommandText = "SELECT 1 FROM dual";
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct)) == 1;
    }
    public ValueTask DisposeAsync() => connection is null ? ValueTask.CompletedTask : connection.DisposeAsync();
}
