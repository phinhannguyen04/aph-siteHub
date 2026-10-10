using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using APH.SiteHub.Infrastructure;
using APH.SiteHub.Infrastructure.Security;
namespace APH.SiteHub.Api.Security;

public sealed class Sessions(SiteHubOptions options, TimeProvider clock)
{
    public const string CookieName = "admin_session";
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private byte[] Sign(string value) => HMACSHA256.HashData(Encoding.UTF8.GetBytes(options.SessionSecret), Encoding.UTF8.GetBytes(value));
    public string Issue(HttpResponse response, string version)
    {
        var csrf = Base64Url.Encode(RandomNumberGenerator.GetBytes(32));
        var payload = Base64Url.Encode(JsonSerializer.SerializeToUtf8Bytes(new SessionPayload(clock.GetUtcNow().AddHours(8).ToUnixTimeMilliseconds(), csrf, version), JsonOptions));
        response.Cookies.Append(CookieName, payload + "." + Base64Url.Encode(Sign(payload)), CookieOptions(TimeSpan.FromHours(8)));
        return csrf;
    }
    public SessionPayload? Read(HttpRequest request)
    {
        if (!request.Cookies.TryGetValue(CookieName, out var token))
        {
            return null;
        }
        var parts = token.Split('.');
        if (parts.Length != 2 || token.Length > 2048)
        {
            return null;
        }
        try
        {
            if (!CryptographicOperations.FixedTimeEquals(Sign(parts[0]), Base64Url.Decode(parts[1])))
            {
                return null;
            }
            var session = JsonSerializer.Deserialize<SessionPayload>(Base64Url.Decode(parts[0]), JsonOptions);
            return session is { Csrf.Length: > 0, Version.Length: > 0 } && session.Exp > clock.GetUtcNow().ToUnixTimeMilliseconds() ? session : null;
        }
        catch (Exception ex) when (ex is FormatException or JsonException) { return null; }
    }
    public bool SameOrigin(HttpRequest request) => options.Origins.Contains(request.Headers.Origin.ToString(), StringComparer.Ordinal);
    public static bool ValidCsrf(HttpRequest request, string csrf) => CryptographicOperations.FixedTimeEquals(
        Encoding.UTF8.GetBytes(request.Headers["x-csrf-token"].ToString()), Encoding.UTF8.GetBytes(csrf));
    public void Clear(HttpResponse response) => response.Cookies.Append(CookieName, "", CookieOptions(TimeSpan.Zero));
    private CookieOptions CookieOptions(TimeSpan maxAge) => new() { HttpOnly = true, SameSite = SameSiteMode.Strict, Secure = options.CookieSecure, Path = "/api", MaxAge = maxAge };
}
