using System.Security.Claims;
using System.Text.Encodings.Web;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Application;
using APH.SiteHub.Application.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
namespace APH.SiteHub.Api.Security;

public sealed class SessionAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger,
    UrlEncoder encoder, Sessions sessions, AuthService auth) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    private const string FailureKey = "SiteHub.AuthenticationFailure";
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var session = sessions.Read(Request);
        if (session is null)
        {
            return AuthenticateResult.NoResult();
        }
        var current = await auth.CurrentAsync(Context.RequestAborted);
        if (current.IsFailure)
        {
            Context.Items[FailureKey] = current.Error;
            return AuthenticateResult.Fail("Unable to validate session");
        }
        if (session.Version != current.Value.Version)
        {
            return AuthenticateResult.Fail("Revoked session");
        }
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "primary"), new Claim("csrf", session.Csrf), new Claim("version", session.Version) };
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name));
    }
    protected override Task HandleChallengeAsync(AuthenticationProperties properties) => ErrorHttpMapper.WriteAsync(Response,
        Context.Items[FailureKey] as Error ?? Error.Unauthorized(), Context.RequestAborted);
    protected override Task HandleForbiddenAsync(AuthenticationProperties properties) => ErrorHttpMapper.WriteAsync(Response,
        Error.Forbidden("Invalid session or request origin"), Context.RequestAborted);
}
