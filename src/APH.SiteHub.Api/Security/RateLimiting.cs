using System.Globalization;
using System.Threading.RateLimiting;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Application;

namespace APH.SiteHub.Api.Security;

public static class RateLimiting
{
    public const string LoginPolicy = "login";
    private const int LoginPermitLimit = 5;
    private static readonly TimeSpan LoginWindow = TimeSpan.FromMinutes(15);

    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services)
    {
        return services.AddRateLimiter(limiter =>
        {
            limiter.AddPolicy(
                LoginPolicy,
                http => RateLimitPartition.GetFixedWindowLimiter(
                    http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = LoginPermitLimit,
                        Window = LoginWindow,
                        QueueLimit = 0
                    }
                )
            );
            limiter.OnRejected = async (context, ct) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                }
                await ErrorHttpMapper.WriteAsync(
                    context.HttpContext.Response,
                    new Error(
                        "RATE_LIMITED",
                        "Please try again in 15 minutes",
                        ErrorType.RateLimited
                    ),
                    ct
                );
            };
        });
    }
}
