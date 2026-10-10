using APH.SiteHub.Application;
namespace APH.SiteHub.Api.Http;

public static class ResultHttpExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result, Func<T, object>? project = null, int successStatus = 200) =>
        result.IsFailure ? ErrorHttpMapper.ToHttpResult(result.Error)
            : Results.Json(project is null ? result.Value : project(result.Value), statusCode: successStatus);
    public static IResult ToHttpResult(this Result result) => result.IsFailure
        ? ErrorHttpMapper.ToHttpResult(result.Error) : Results.Ok(new
        {
            ok = true
        });
}
