using APH.SiteHub.Application;
namespace APH.SiteHub.Api.Http;

public static class ErrorHttpMapper
{
    public static int StatusCode(Error error) => error.Type switch
    {
        ErrorType.Validation => 400,
        ErrorType.Unauthorized => 401,
        ErrorType.Forbidden => 403,
        ErrorType.NotFound => 404,
        ErrorType.Conflict => 409,
        ErrorType.PayloadTooLarge => 413,
        ErrorType.RateLimited => 429,
        ErrorType.Unavailable => 503,
        _ => 500
    };
    public static object Body(Error error) => new { error = new { code = error.Code, message = error.Message } };
    public static IResult ToHttpResult(Error error) => Results.Json(Body(error), statusCode: StatusCode(error));
    public static Task WriteAsync(HttpResponse response, Error error, CancellationToken ct)
    {
        response.StatusCode = StatusCode(error);
        return response.WriteAsJsonAsync(Body(error), ct);
    }
}
