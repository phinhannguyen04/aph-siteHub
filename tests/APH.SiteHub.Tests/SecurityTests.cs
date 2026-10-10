using System.Text.Json;
using APH.SiteHub.Api.Security;
using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure;
using APH.SiteHub.Infrastructure.Security;
using Microsoft.AspNetCore.Http;
using Xunit;
namespace APH.SiteHub.Tests;

public sealed class SecurityTests
{
    internal static SiteHubOptions Options => new("", "test-session-secret-32-characters-long", ["http://localhost"], false, new string('a', 64), null, 8080);
    internal static JsonElement Legacy => JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures/legacy-security.json"))).RootElement;
    [Fact]
    public void ReadsBunArgon2idHash()
    {
        var hasher = new ArgonPasswordHasher();
        var fixture = Legacy;
        Assert.True(hasher.Verify(fixture.GetProperty("password").GetString()!, fixture.GetProperty("hash").GetString()!).Value);
        Assert.False(hasher.Verify("wrong-password", fixture.GetProperty("hash").GetString()!).Value);
        var generated = hasher.Hash("replacement-password").Value;
        Assert.StartsWith("$argon2id$", generated);
        Assert.True(hasher.Verify("replacement-password", generated).Value);
    }
    [Fact]
    public void ReadsNodeAesGcmEnvelopeAndRejectsWrongAccount()
    {
        var fixture = Legacy;
        var secrets = new SecretProtector(Options);
        Assert.Equal("legacy-secret", secrets.Decrypt(fixture.GetProperty("id").GetString()!, fixture.GetProperty("envelope").GetString()!).Value);
        Assert.Equal(ErrorType.Unexpected, secrets.Decrypt("wrong-account", fixture.GetProperty("envelope").GetString()!).Error.Type);
        var encrypted = secrets.Encrypt("new-account", "new-secret").Value;
        Assert.Equal("new-secret", secrets.Decrypt("new-account", encrypted).Value);
        Assert.NotEqual(encrypted, secrets.Encrypt("new-account", "new-secret").Value);
    }
    [Fact]
    public void ReadsNodeSignedSessionAndRejectsTampering()
    {
        var sessions = new Sessions(Options, TimeProvider.System);
        var http = new DefaultHttpContext();
        var token = Legacy.GetProperty("token").GetString()!;
        http.Request.Headers.Cookie = "admin_session=" + token;
        Assert.Equal("legacy-csrf", sessions.Read(http.Request)!.Csrf);
        Assert.Equal("legacy-version", sessions.Read(http.Request)!.Version);
        http.Request.Headers.Cookie = "admin_session=" + token + "x";
        Assert.Null(sessions.Read(http.Request));
    }
    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("https://user:password@example.com")]
    [InlineData("invalid")]
    [InlineData("ftp://example.com")]
    public void RejectsUnsafeUrls(string url) => Assert.Equal(ErrorType.Validation, Normalize.Url(url).Error.Type);
    [Fact]
    public void FoldsVietnameseSearchAndRejectsDuplicateTags()
    {
        Assert.Equal("duong dan", Normalize.Fold("Đường dẫn"));
        var id = Guid.NewGuid().ToString();
        Assert.Equal(ErrorType.Validation, Normalize.TagIds([id, id]).Error.Type);
    }
    [Fact]
    public void LoginLimiterExpiresAndResets()
    {
        var clock = new TestClock();
        var limiter = new LoginLimiter(clock);
        for (var i = 0; i < 5; i++)
        {
            limiter.Failed("test");
        }
        Assert.True(limiter.Blocked("test"));
        clock.Now = clock.Now.AddMinutes(16);
        Assert.False(limiter.Blocked("test"));
        limiter.Failed("test");
        limiter.Reset("test");
        Assert.False(limiter.Blocked("test"));
    }
    private sealed class TestClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => Now;
    }
}
