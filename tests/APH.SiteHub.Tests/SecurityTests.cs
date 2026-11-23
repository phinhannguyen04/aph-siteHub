using System.Text.Json;
using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure;
using APH.SiteHub.Infrastructure.Security;
using Xunit;
namespace APH.SiteHub.Tests;

public sealed class SecurityTests
{
    internal static SiteHubOptions Options => new(
        "",
        ["http://localhost"],
        new string('a', 64),
        8080
    );
    internal static JsonElement Legacy => JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures/legacy-security.json"))).RootElement;
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
}
