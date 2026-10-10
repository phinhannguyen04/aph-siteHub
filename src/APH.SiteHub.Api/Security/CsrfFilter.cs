using APH.SiteHub.Api.Http;
using APH.SiteHub.Application;
namespace APH.SiteHub.Api.Security;

public sealed class CsrfFilter(Sessions sessions) : IEndpointFilter
{
    public ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        if (!HttpMethods.IsGet(http.Request.Method) && !HttpMethods.IsHead(http.Request.Method) &&
            (!sessions.SameOrigin(http.Request) || !Sessions.ValidCsrf(http.Request, http.User.FindFirst("csrf")?.Value ?? "")))
        {
            return ValueTask.FromResult<object?>(ErrorHttpMapper.ToHttpResult(Error.Forbidden("Invalid session or request origin")));
        }
        return next(context);
    }
}
