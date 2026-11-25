using APH.SiteHub.Application;
using Microsoft.AspNetCore.Mvc;
namespace APH.SiteHub.Api.Http;

public static class ResultHttpExtensions
{
    public static IResult ToHttpResult<T>(
        this Result<T> result,
        Func<T, object>? project = null,
        int successStatus = 200
    ) =>
        result.IsFailure ? ErrorHttpMapper.ToHttpResult(result.Error)
            : Results.Json(project is null ? result.Value : project(result.Value), statusCode: successStatus);
    public static IResult ToHttpResult(this Result result) => result.IsFailure
        ? ErrorHttpMapper.ToHttpResult(result.Error) : Results.Ok(new
        {
            ok = true
        });

    public static IActionResult ToActionResult<T>(
        this Result<T> result,
        Func<T, object>? project = null,
        int successStatus = 200
    ) => new ResultActionResult(result.ToHttpResult(project, successStatus));
    public static IActionResult ToActionResult(this Result result) => new ResultActionResult(result.ToHttpResult());
    public static IActionResult ToActionResult(this Error error) => new ResultActionResult(ErrorHttpMapper.ToHttpResult(error));
}
