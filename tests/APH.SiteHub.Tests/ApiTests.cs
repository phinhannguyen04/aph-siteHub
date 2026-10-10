using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using APH.SiteHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;
namespace APH.SiteHub.Tests;

public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("POSTGRES_TEST_URL")))
        {
            Skip = "POSTGRES_TEST_URL is required (isolated disposable PostgreSQL only)";
        }
    }
}
public sealed class ApiTests
{
    [PostgresFact]
    public async Task MigratesExistingDataAndPreservesApiSecurityAndTransactions()
    {
        await using var fixture = await ApiFixture.CreateAsync(legacy: true);
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
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/websites", new StringContent(body, System.Text.Encoding.UTF8, "application/json"))).StatusCode);
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
    [PostgresFact]
    public async Task CreatesFreshSchemaAndRejectsBruteForceLogin()
    {
        await using var fixture = await ApiFixture.CreateAsync(legacy: false);
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
    [PostgresFact]
    public async Task CredentialReadFailureStaysServerErrorInsteadOfUnauthorized()
    {
        await using var fixture = await ApiFixture.CreateAsync(legacy: false);
        using var client = fixture.Factory.CreateClient();
        client.DefaultRequestHeaders.Add("Origin", "http://localhost");
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            password = "legacy-password-123"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        await using (var scope = fixture.Factory.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<SiteHubDbContext>().Database.ExecuteSqlRawAsync("DROP TABLE admin_credentials");
        }
        var response = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var error = (await Json(response)).GetProperty("error");
        Assert.Equal("INTERNAL_ERROR", error.GetProperty("code").GetString());
        Assert.Equal("Internal server error", error.GetProperty("message").GetString());
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) => JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();
}
internal sealed class ApiFixture : IAsyncDisposable
{
    public WebApplicationFactory<Program> Factory { get; } = new();
    private readonly string database;
    private readonly string adminConnection;
    private readonly Dictionary<string, string?> original = new();
    private ApiFixture(string database, string adminConnection)
    {
        this.database = database;
        this.adminConnection = adminConnection;
    }
    public static async Task<ApiFixture> CreateAsync(bool legacy)
    {
        var database = "sitehub_test_" + Guid.NewGuid().ToString("N");
        var url = new Uri(Environment.GetEnvironmentVariable("POSTGRES_TEST_URL")!);
        var info = url.UserInfo.Split(':', 2);
        var admin = new NpgsqlConnectionStringBuilder { Host = url.Host, Port = url.Port, Username = Uri.UnescapeDataString(info[0]), Password = Uri.UnescapeDataString(info[1]), Database = url.AbsolutePath.TrimStart('/') };
        var fixture = new ApiFixture(database, admin.ConnectionString);
        await using (var connection = new NpgsqlConnection(admin.ConnectionString))
        {
            await connection.OpenAsync();
            await new NpgsqlCommand($"CREATE DATABASE {database}", connection).ExecuteNonQueryAsync();
        }
        fixture.Set("DATABASE_URL", new UriBuilder(url) { Path = database }.Uri.ToString());
        fixture.Set("SESSION_SECRET", "test-session-secret-32-characters-long");
        fixture.Set("APP_ORIGIN", "http://localhost");
        fixture.Set("APP_ORIGINS", "");
        fixture.Set("COOKIE_SECURE", "false");
        fixture.Set("ACCOUNT_ENCRYPTION_KEY", new string('a', 64));
        fixture.Set("ADMIN_PASSWORD_HASH_BASE64", Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(SecurityTests.Legacy.GetProperty("hash").GetString()!)));
        if (legacy)
        {
            admin.Database = database;
            await using var connection = new NpgsqlConnection(admin.ConnectionString);
            await connection.OpenAsync();
            await new NpgsqlCommand(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures/legacy-schema.sql")), connection).ExecuteNonQueryAsync();
            await new NpgsqlCommand("CREATE TABLE typeorm_migrations (id serial PRIMARY KEY, timestamp bigint NOT NULL, name varchar NOT NULL); INSERT INTO typeorm_migrations (timestamp,name) VALUES (1791158400000,'InitialSchema1791158400000'),(1791244800000,'Accounts1791244800000');", connection).ExecuteNonQueryAsync();
            var json = SecurityTests.Legacy;
            await using var seed = new NpgsqlCommand("""
                INSERT INTO admin_credentials VALUES ('primary', @hash, 'legacy-version');
                INSERT INTO tags VALUES ('11111111-1111-4111-8111-111111111111','Legacy tag','legacy tag','','#123456','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
                INSERT INTO websites VALUES ('22222222-2222-4222-8222-222222222222','Legacy site','https://legacy.example/','legacy site https://legacy.example/','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
                INSERT INTO website_tags VALUES ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',0);
                INSERT INTO accounts VALUES (@id,'legacy','legacy-login','0001','legacy@example.com','legacy-password',@envelope,false,now());
                """, connection);
            seed.Parameters.AddWithValue("hash", json.GetProperty("hash").GetString()!);
            seed.Parameters.AddWithValue("id", json.GetProperty("id").GetString()!);
            seed.Parameters.AddWithValue("envelope", json.GetProperty("envelope").GetString()!);
            await seed.ExecuteNonQueryAsync();
        }
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SiteHubDbContext>();
        await db.Database.MigrateAsync();
        await db.Database.MigrateAsync();
        if (legacy)
        {
            Assert.Equal(2, await db.Database.SqlQueryRaw<int>("SELECT count(*)::int AS \"Value\" FROM typeorm_migrations").SingleAsync());
            Assert.Equal("legacy-version", (await db.Credentials.AsNoTracking().SingleAsync()).Version);
            Assert.Equal(1, await db.Accounts.CountAsync());
            Assert.Equal(1, await db.Websites.CountAsync());
        }
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
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
        NpgsqlConnection.ClearAllPools();
        await using var connection = new NpgsqlConnection(adminConnection);
        await connection.OpenAsync();
        await new NpgsqlCommand($"DROP DATABASE {database} WITH (FORCE)", connection).ExecuteNonQueryAsync();
    }
}
