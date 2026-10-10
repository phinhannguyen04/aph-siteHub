using Microsoft.Extensions.Configuration;
using Npgsql;
namespace APH.SiteHub.Infrastructure;

public sealed record SiteHubOptions(string ConnectionString, string SessionSecret, string[] Origins, bool CookieSecure, string? EncryptionKey, string? AdminPasswordHash, int Port)
{
    public static SiteHubOptions Read(IConfiguration config)
    {
        var database = config["DATABASE_URL"] ?? throw new InvalidOperationException("DATABASE_URL is required");
        var uri = new Uri(database);
        if (uri.Scheme is not ("postgres" or "postgresql"))
        {
            throw new InvalidOperationException("DATABASE_URL must use PostgreSQL");
        }
        var user = uri.UserInfo.Split(':', 2);
        var connection = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = Uri.UnescapeDataString(user[0]),
            Password = user.Length > 1 ? Uri.UnescapeDataString(user[1]) : "",
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            IncludeErrorDetail = false
        };
        foreach (var parameter in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var pair = parameter.Split('=', 2);
            if (pair.Length != 2)
            {
                throw new InvalidOperationException("Invalid DATABASE_URL parameter");
            }
            switch (pair[0])
            {
                case "sslmode":
                    connection.SslMode = Enum.Parse<SslMode>(pair[1], true);
                    break;
                case "sslrootcert":
                    connection.RootCertificate = Uri.UnescapeDataString(pair[1]);
                    break;
                default:
                    throw new InvalidOperationException("Unsupported DATABASE_URL parameter");
            }
        }
        var secret = config["SESSION_SECRET"] ?? "";
        if (secret.Length < 32)
        {
            throw new InvalidOperationException("SESSION_SECRET must be at least 32 characters");
        }
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
        var hash = !string.IsNullOrEmpty(config["ADMIN_PASSWORD_HASH_BASE64"])
            ? System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(config["ADMIN_PASSWORD_HASH_BASE64"]!)) : config["ADMIN_PASSWORD_HASH"];
        if (!string.IsNullOrEmpty(hash) && !hash.StartsWith("$argon2id$", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Initial password hash must be Argon2id");
        }
        if (!int.TryParse(config["API_PORT"] ?? "3000", out var port) || port is < 1 or > 65535)
        {
            throw new InvalidOperationException("Invalid API_PORT");
        }
        return new(connection.ConnectionString, secret, origins, config["COOKIE_SECURE"] != "false", key, hash, port);
    }
}
