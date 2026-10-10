using System.Text.Json;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Application;
using Microsoft.AspNetCore.Diagnostics;
namespace APH.SiteHub.Api;

// Last-resort transport boundary for malformed framework requests and unexpected bugs.
public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception exception, CancellationToken ct)
    {
        var error = exception switch
        {
            BadHttpRequestException { StatusCode: 413 } => new Error("HTTP_ERROR", "Invalid request", ErrorType.PayloadTooLarge),
            BadHttpRequestException or JsonException => Error.Invalid("Invalid request body"),
            _ => Error.Unexpected()
        };
        if (error.Type == ErrorType.Unexpected)
        {
            logger.LogError("API request failed with exception type {Type}", exception.GetType().Name);
        }
        await ErrorHttpMapper.WriteAsync(http.Response, error, ct);
        return true;
    }
}
