using Microsoft.Extensions.Configuration;
using Npgsql;
namespace APH.SiteHub.Infrastructure;

public sealed record SiteHubOptions(
    string ConnectionString,
    string[] Origins,
    string? EncryptionKey,
    int Port
)
{
    public static SiteHubOptions Read(IConfiguration config)
    {
        var database = config["DATABASE_URL"] ?? throw new InvalidOperationException("DATABASE_URL is required");
        var uri = new Uri(database);
        if (uri.Scheme is not ("postgres" or "postgresql"))
        {
            throw new InvalidOperationException("DATABASE_URL must use postgres://user:password@host:port/database");
        }
        var user = uri.UserInfo.Split(':', 2);
        var name = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));
        if (string.IsNullOrEmpty(uri.Host) || string.IsNullOrEmpty(name) || user[0].Length == 0)
        {
            throw new InvalidOperationException("DATABASE_URL must include user, host and database name");
        }
        if (uri.Query.Length > 1)
        {
            throw new InvalidOperationException("Unsupported DATABASE_URL parameter");
        }
        var connection = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = name,
            Username = Uri.UnescapeDataString(user[0]),
            Password = user.Length > 1 ? Uri.UnescapeDataString(user[1]) : ""
        };
        var origin = config["APP_ORIGIN"] ?? throw new InvalidOperationException("APP_ORIGIN is required");
        var origins = new[] { origin }.Concat((config["APP_ORIGINS"] ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries)).Select(value =>
        {
            var url = new Uri(value.Trim());
            if (url.Scheme is not ("http" or "https"))
            {
                throw new InvalidOperationException("Invalid application origin");
            }
            return url.GetLeftPart(UriPartial.Authority);
        }).Distinct().ToArray();
        var key = config["ACCOUNT_ENCRYPTION_KEY"];
        if (!string.IsNullOrEmpty(key) && (key.Length != 64 || !key.All(Uri.IsHexDigit)))
        {
            throw new InvalidOperationException("ACCOUNT_ENCRYPTION_KEY must contain 64 hexadecimal characters");
        }
        if (!int.TryParse(config["API_PORT"] ?? "3000", out var port) || port is < 1 or > 65535)
        {
            throw new InvalidOperationException("Invalid API_PORT");
        }
        return new(
            connection.ConnectionString,
            origins,
            key,
            port
        );
    }
}
