using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using APH.SiteHub.Infrastructure.Persistence;
using Dapper;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Oracle.ManagedDataAccess.Client;
using Xunit;
namespace APH.SiteHub.Tests;

public sealed class OracleFactAttribute : FactAttribute
{
    public OracleFactAttribute()
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ORACLE_TEST_URL")))
        {
            Skip = "ORACLE_TEST_URL is required (a disposable Oracle PDB where the user may create and drop users)";
        }
    }
}
public sealed class ApiTests
{
    [OracleFact]
    public async Task DeletesWebsiteAndCascadesTagsOnlyWithAuthenticatedCsrfRequest()
    {
        await using var fixture = await ApiFixture.CreateAsync(seeded: false);
        using var client = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            password = "legacy-password-123"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var csrf = (await Json(login)).GetProperty("csrfToken").GetString()!;
        client.DefaultRequestHeaders.Add("x-csrf-token", csrf);
        var tag = await client.PostAsJsonAsync("/api/tags", new
        {
            name = "Delete test",
            color = "#123456"
        });
        Assert.Equal(HttpStatusCode.Created, tag.StatusCode);
        var tagId = (await Json(tag)).GetProperty("tag").GetProperty("id").GetString()!;
        var website = await client.PostAsJsonAsync("/api/websites", new
        {
            name = "Delete test",
            url = "https://example.com",
            tag_ids = new[] { tagId }
        });
        Assert.Equal(HttpStatusCode.Created, website.StatusCode);
        var id = (await Json(website)).GetProperty("website").GetProperty("id").GetString()!;
        var path = "/api/websites/" + id;

        using var anonymous = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        anonymous.DefaultRequestHeaders.Add("Origin", "http://localhost");
        anonymous.DefaultRequestHeaders.Add("x-csrf-token", csrf);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.DeleteAsync(path)).StatusCode);
        client.DefaultRequestHeaders.Remove("x-csrf-token");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.DeleteAsync(path)).StatusCode);
        client.DefaultRequestHeaders.Add("x-csrf-token", "invalid");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.DeleteAsync(path)).StatusCode);
        client.DefaultRequestHeaders.Remove("x-csrf-token");
        client.DefaultRequestHeaders.Add("x-csrf-token", csrf);
        client.DefaultRequestHeaders.Remove("Origin");
        client.DefaultRequestHeaders.Add("Origin", "https://untrusted.example");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.DeleteAsync(path)).StatusCode);
        client.DefaultRequestHeaders.Remove("Origin");
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        await using (var scope = fixture.Factory.Services.CreateAsyncScope())
        {
            var connection = await scope.ServiceProvider.GetRequiredService<DbSession>().OpenAsync(CancellationToken.None);
            Assert.Equal(1, await TestSql.ScalarAsync(connection, "SELECT COUNT(*) FROM websites WHERE website_id = :id", ("id", id)));
            Assert.Equal(1, await TestSql.ScalarAsync(connection, "SELECT COUNT(*) FROM website_tags WHERE website_id = :id", ("id", id)));
        }

        var deleted = await client.DeleteAsync(path);
        Assert.Equal(HttpStatusCode.OK, deleted.StatusCode);
        Assert.True((await Json(deleted)).GetProperty("ok").GetBoolean());
        await using (var scope = fixture.Factory.Services.CreateAsyncScope())
        {
            var connection = await scope.ServiceProvider.GetRequiredService<DbSession>().OpenAsync(CancellationToken.None);
            Assert.Equal(0, await TestSql.ScalarAsync(connection, "SELECT COUNT(*) FROM websites WHERE website_id = :id", ("id", id)));
            Assert.Equal(0, await TestSql.ScalarAsync(connection, "SELECT COUNT(*) FROM website_tags WHERE website_id = :id", ("id", id)));
            Assert.Equal(1, await TestSql.ScalarAsync(connection, "SELECT COUNT(*) FROM tags WHERE tag_id = :id", ("id", tagId)));
        }
        var page = await Json(await client.GetAsync("/api/websites"));
        Assert.Equal(0, page.GetProperty("total").GetInt32());
        Assert.Empty(page.GetProperty("websites").EnumerateArray());
        foreach (var missingPath in new[] { path, "/api/websites/" + Guid.NewGuid() })
        {
            var missing = await client.DeleteAsync(missingPath);
            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
            var error = (await Json(missing)).GetProperty("error");
            Assert.Equal("NOT_FOUND", error.GetProperty("code").GetString());
            Assert.Equal("Website not found", error.GetProperty("message").GetString());
        }
    }

    [OracleFact]
    public async Task ServesSeededDataAndPreservesApiSecurityAndTransactions()
    {
        await using var fixture = await ApiFixture.CreateAsync(seeded: true);
        using var client = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        var unauthorized = await client.GetAsync("/api/websites");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);
        Assert.Equal("UNAUTHORIZED", (await Json(unauthorized)).GetProperty("error").GetProperty("code").GetString());
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            password = "legacy-password-123"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = login.Headers.GetValues("Set-Cookie").Single();
        Assert.Contains("httponly", cookie.ToLowerInvariant());
        Assert.Contains("samesite=strict", cookie.ToLowerInvariant());
        var csrf = (await Json(login)).GetProperty("csrfToken").GetString()!;
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/tags", new
        {
            name = "blocked",
            color = "#123456"
        })).StatusCode);
        client.DefaultRequestHeaders.Add("x-csrf-token", csrf);
        var tagsResponse = await Json(await client.GetAsync("/api/tags"));
        Assert.Equal("Legacy tag", tagsResponse.GetProperty("tags")[0].GetProperty("name").GetString());
        var legacySecret = await client.GetAsync("/api/accounts/" + SecurityTests.Legacy.GetProperty("id").GetString() + "/secret-key");
        Assert.Equal("legacy-secret", (await Json(legacySecret)).GetProperty("secret_key").GetString());
        Assert.True(legacySecret.Headers.CacheControl!.NoStore);
        var tag = await client.PostAsJsonAsync("/api/tags", new
        {
            name = "#Đường dẫn",
            description = "test",
            color = "#ABCDEF"
        });
        Assert.Equal(HttpStatusCode.Created, tag.StatusCode);
        var tagJson = (await Json(tag)).GetProperty("tag");
        var tagId = tagJson.GetProperty("id").GetString()!;
        Assert.Equal("#abcdef", tagJson.GetProperty("color").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/tags", new
        {
            name = "đường dẫn",
            color = "#abcdef"
        })).StatusCode);
        var website = await client.PostAsJsonAsync("/api/websites", new
        {
            name = "Đường dẫn",
            url = "https://example.com",
            tag_ids = new[] { tagId }
        });
        Assert.Equal(HttpStatusCode.Created, website.StatusCode);
        var siteId = (await Json(website)).GetProperty("website").GetProperty("id").GetString()!;
        var page = await Json(await client.GetAsync("/api/websites?search=duong&tagIds=" + tagId));
        Assert.Equal(1, page.GetProperty("total").GetInt32());
        Assert.Equal(12, page.GetProperty("pageSize").GetInt32());
        Assert.Equal(tagId, page.GetProperty("websites")[0].GetProperty("tag_ids")[0].GetString());
        var failedUpdate = await client.PatchAsJsonAsync("/api/websites/" + siteId, new
        {
            name = "should roll back",
            tag_ids = new[] { Guid.NewGuid().ToString() }
        });
        Assert.Equal(HttpStatusCode.BadRequest, failedUpdate.StatusCode);
        var unchanged = await Json(await client.GetAsync("/api/websites?search=duong"));
        Assert.Equal("Đường dẫn", unchanged.GetProperty("websites")[0].GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync("/api/websites/" + siteId, new
        {
            name = "Updated",
            tag_ids = Array.Empty<string>()
        })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PatchAsJsonAsync("/api/websites/" + Guid.NewGuid(), new
        {
            name = "missing"
        })).StatusCode);
        var accountInput = new
        {
            provider = "provider",
            login_name = "login",
            external_account_id = "00123",
            email = "account@example.com",
            password = "password",
            secret_key = "secret",
            is_limit = false
        };
        var accountResponse = await client.PostAsJsonAsync("/api/accounts", accountInput);
        Assert.Equal(HttpStatusCode.Created, accountResponse.StatusCode);
        var accountJson = (await Json(accountResponse)).GetProperty("account");
        var accountId = accountJson.GetProperty("id").GetString()!;
        Assert.False(accountJson.TryGetProperty("password", out _));
        Assert.False(accountJson.TryGetProperty("secret_key_encrypted", out _));
        Assert.Equal("00123", accountJson.GetProperty("external_account_id").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/accounts", accountInput)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync("/api/accounts/" + accountId, new
        {
            password = "replacement",
            secret_key = "replacement-secret",
            is_limit = true
        })).StatusCode);
        var secret = await client.GetAsync("/api/accounts/" + accountId + "/secret-key");
        Assert.Equal("replacement-secret", (await Json(secret)).GetProperty("secret_key").GetString());
        Assert.True(secret.Headers.CacheControl!.NoStore);
        var listText = await (await client.GetAsync("/api/accounts")).Content.ReadAsStringAsync();
        Assert.DoesNotContain("replacement-secret", listText);
        Assert.DoesNotContain("password", listText);
        Assert.DoesNotContain("secret_key", listText);
        var stats = await Json(await client.GetAsync("/api/accounts/stats"));
        Assert.Equal(1, stats.GetProperty("stats").GetProperty("limited").GetInt32());
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync("/api/accounts/" + accountId)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/accounts/" + accountId)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync("/api/tags/" + tagId)).StatusCode);
        var legacyTagId = "11111111-1111-4111-8111-111111111111";
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync("/api/tags/" + legacyTagId)).StatusCode);
        var legacySite = await Json(await client.GetAsync("/api/websites?search=legacy"));
        Assert.Empty(legacySite.GetProperty("websites")[0].GetProperty("tags").EnumerateArray());
        foreach (var invalid in new[] { "/api/websites?page=0", "/api/websites?pageSize=49", "/api/websites?unknown=true", "/api/websites?tagIds=invalid", "/api/websites?page=1&page=2" })
        {
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync(invalid)).StatusCode);
        }
        foreach (var body in new[] { "{}", "{\"name\":null}", "{\"unknown\":true}", "{\"name\":\"x\",\"url\":\"javascript:alert(1)\"}", "{", "{\"name\":\"x\",\"name\":\"y\"}" })
        {
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/websites", new StringContent(
                body,
                System.Text.Encoding.UTF8,
                "application/json"
            ))).StatusCode);
        }
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PatchAsJsonAsync("/api/accounts/" + SecurityTests.Legacy.GetProperty("id").GetString(), new
        {
            is_limit = (bool?)null
        })).StatusCode);
        client.DefaultRequestHeaders.Remove("Origin");
        client.DefaultRequestHeaders.Add("Origin", "https://untrusted.example");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.DeleteAsync("/api/tags/missing")).StatusCode);
        client.DefaultRequestHeaders.Remove("Origin");
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        using var oldSession = fixture.Factory.CreateClient();
        oldSession.DefaultRequestHeaders.Add("Cookie", cookie.Split(';')[0]);
        var changed = await client.PostAsJsonAsync("/api/auth/change-password", new
        {
            currentPassword = "legacy-password-123",
            newPassword = "replacement-password-123"
        });
        Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await oldSession.GetAsync("/api/auth/session")).StatusCode);
        client.DefaultRequestHeaders.Remove("x-csrf-token");
        client.DefaultRequestHeaders.Add("x-csrf-token", (await Json(changed)).GetProperty("csrfToken").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/session")).StatusCode);
    }
    [OracleFact]
    public async Task PagesWebsitesAndTreatsSearchWildcardsAsLiteralText()
    {
        await using var fixture = await ApiFixture.CreateAsync(seeded: false);
        using var client = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            password = "legacy-password-123"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        client.DefaultRequestHeaders.Add("x-csrf-token", (await Json(login)).GetProperty("csrfToken").GetString());
        foreach (var name in new[] { "Alpha", "Beta", "100%_done" })
        {
            Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/websites", new
            {
                name,
                url = "https://example.com/" + Uri.EscapeDataString(name),
                tag_ids = Array.Empty<string>()
            })).StatusCode);
            await Task.Delay(5);
        }
        var second = await Json(await client.GetAsync("/api/websites?pageSize=1&page=2"));
        Assert.Equal(3, second.GetProperty("total").GetInt32());
        Assert.Equal("Beta", second.GetProperty("websites")[0].GetProperty("name").GetString());
        var beyond = await Json(await client.GetAsync("/api/websites?pageSize=1&page=99"));
        Assert.Equal(3, beyond.GetProperty("total").GetInt32());
        Assert.Empty(beyond.GetProperty("websites").EnumerateArray());
        // "%" and "_" must not act as LIKE wildcards: only the literal "100%_done" matches.
        var percent = await Json(await client.GetAsync("/api/websites?search=" + Uri.EscapeDataString("%")));
        Assert.Equal(1, percent.GetProperty("total").GetInt32());
        var underscore = await Json(await client.GetAsync("/api/websites?search=" + Uri.EscapeDataString("a_p")));
        Assert.Equal(0, underscore.GetProperty("total").GetInt32());
    }
    [OracleFact]
    public async Task CreatesFreshSchemaAndRejectsBruteForceLogin()
    {
        await using var fixture = await ApiFixture.CreateAsync(seeded: false);
        using var client = fixture.Factory.CreateClient();
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login", new
            {
                password = "wrong"
            })).StatusCode);
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/auth/login", new
        {
            password = "legacy-password-123"
        })).StatusCode);
    }
    [OracleFact]
    public async Task CredentialReadFailureStaysServerErrorInsteadOfUnauthorized()
    {
        await using var fixture = await ApiFixture.CreateAsync(seeded: false);
        using var client = fixture.Factory.CreateClient();
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            password = "legacy-password-123"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        await using (var scope = fixture.Factory.Services.CreateAsyncScope())
        {
            var connection = await scope.ServiceProvider.GetRequiredService<DbSession>().OpenAsync(CancellationToken.None);
            await connection.ExecuteAsync("DROP TABLE admin_credentials");
        }
        var response = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var error = (await Json(response)).GetProperty("error");
        Assert.Equal("INTERNAL_ERROR", error.GetProperty("code").GetString());
        Assert.Equal("Internal server error", error.GetProperty("message").GetString());
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) => JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();
}
internal static class TestSql
{
    public static async Task<int> ExecuteAsync(OracleConnection connection, string sql, params (string Name, string Value)[] parameters)
    {
        await using var command = connection.CreateCommand();
        command.BindByName = true;
        command.CommandText = sql;
        foreach (var (name, value) in parameters)
        {
            command.Parameters.Add(name, value);
        }
        return await command.ExecuteNonQueryAsync();
    }
    public static async Task<int> ScalarAsync(OracleConnection connection, string sql, params (string Name, string Value)[] parameters)
    {
        await using var command = connection.CreateCommand();
        command.BindByName = true;
        command.CommandText = sql;
        foreach (var (name, value) in parameters)
        {
            command.Parameters.Add(name, value);
        }
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }
}
internal sealed class ApiFixture : IAsyncDisposable
{
    public WebApplicationFactory<Program> Factory { get; } = new();
    private readonly string schemaUser;
    private readonly string adminConnection;
    private readonly Dictionary<string, string?> original = new();
    private ApiFixture(string schemaUser, string adminConnection)
    {
        this.schemaUser = schemaUser;
        this.adminConnection = adminConnection;
    }
    // ORACLE_TEST_URL is an admin account (for example system) on a disposable PDB, as oracle://user:password@host:port/service.
    // Every test gets a private schema user so tests are isolated and run in parallel.
    public static async Task<ApiFixture> CreateAsync(bool seeded)
    {
        var schemaUser = "SH_" + Guid.NewGuid().ToString("N")[..20].ToUpperInvariant();
        var password = "Pw_" + Guid.NewGuid().ToString("N");
        var url = new Uri(Environment.GetEnvironmentVariable("ORACLE_TEST_URL")!);
        var info = url.UserInfo.Split(':', 2);
        var service = url.AbsolutePath.TrimStart('/');
        var dataSource = $"{url.Host}:{url.Port}/{service}";
        var admin = new OracleConnectionStringBuilder { DataSource = dataSource, UserID = Uri.UnescapeDataString(info[0]), Password = Uri.UnescapeDataString(info[1]), Pooling = false }.ConnectionString;
        var fixture = new ApiFixture(schemaUser, admin);
        await using (var connection = new OracleConnection(admin))
        {
            await connection.OpenAsync();
            // The lite image has no USERS tablespace, so use whatever the PDB's default is.
            var tablespace = await connection.ExecuteScalarAsync<string>("SELECT property_value FROM database_properties WHERE property_name = 'DEFAULT_PERMANENT_TABLESPACE'");
            await connection.ExecuteAsync($"CREATE USER {schemaUser} IDENTIFIED BY \"{password}\" QUOTA UNLIMITED ON {tablespace}");
            await connection.ExecuteAsync($"GRANT CREATE SESSION, CREATE TABLE TO {schemaUser}");
        }
        fixture.Set("DATABASE_URL", $"oracle://{schemaUser}:{Uri.EscapeDataString(password)}@{url.Host}:{url.Port}/{service}");
        fixture.Set("SESSION_SECRET", "test-session-secret-32-characters-long");
        fixture.Set("APP_ORIGIN", "http://localhost");
        fixture.Set("APP_ORIGINS", "");
        fixture.Set("COOKIE_SECURE", "false");
        fixture.Set("ACCOUNT_ENCRYPTION_KEY", new string('a', 64));
        fixture.Set("ADMIN_PASSWORD_HASH_BASE64", Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(SecurityTests.Legacy.GetProperty("hash").GetString()!)));
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var migrator = scope.ServiceProvider.GetRequiredService<DatabaseMigrator>();
        Assert.Equal(1, await migrator.PendingAsync(CancellationToken.None));
        Assert.Equal(1, await migrator.MigrateAsync(CancellationToken.None));
        Assert.Equal(0, await migrator.MigrateAsync(CancellationToken.None));
        Assert.Equal(0, await migrator.PendingAsync(CancellationToken.None));
        var db = await scope.ServiceProvider.GetRequiredService<DbSession>().OpenAsync(CancellationToken.None);
        if (seeded)
        {
            // Rows written by the previous implementation: a stored Argon2 hash and an encrypted account secret
            // must stay readable, so the on-disk formats are unchanged.
            var json = SecurityTests.Legacy;
            await TestSql.ExecuteAsync(db, "INSERT INTO admin_credentials VALUES ('primary', :hash, 'legacy-version')", ("hash", json.GetProperty("hash").GetString()!));
            await db.ExecuteAsync("INSERT INTO tags VALUES ('11111111-1111-4111-8111-111111111111', 'Legacy tag', 'legacy tag', NULL, '#123456', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')");
            await db.ExecuteAsync("INSERT INTO websites VALUES ('22222222-2222-4222-8222-222222222222', 'Legacy site', 'https://legacy.example/', 'legacy site https://legacy.example/', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')");
            await db.ExecuteAsync("INSERT INTO website_tags VALUES ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 0)");
            await TestSql.ExecuteAsync(
                db,
                "INSERT INTO accounts VALUES (:id, 'legacy', 'legacy-login', '0001', 'legacy@example.com', 'legacy-password', :envelope, 0, SYSTIMESTAMP)",
                ("id", json.GetProperty("id").GetString()!),
                ("envelope", json.GetProperty("envelope").GetString()!)
            );
            Assert.Equal(1, await TestSql.ScalarAsync(db, "SELECT COUNT(*) FROM accounts"));
            Assert.Equal(1, await TestSql.ScalarAsync(db, "SELECT COUNT(*) FROM websites"));
        }
        return fixture;
    }
    private void Set(string key, string value)
    {
        original[key] = Environment.GetEnvironmentVariable(key);
        Environment.SetEnvironmentVariable(key, value);
    }
    public async ValueTask DisposeAsync()
    {
        await Factory.DisposeAsync();
        foreach (var pair in original)
        {
            Environment.SetEnvironmentVariable(pair.Key, pair.Value);
        }
        OracleConnection.ClearAllPools();
        await using var connection = new OracleConnection(adminConnection);
        await connection.OpenAsync();
        await connection.ExecuteAsync($"DROP USER {schemaUser} CASCADE");
    }
}
