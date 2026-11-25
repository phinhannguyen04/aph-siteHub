using Microsoft.AspNetCore.Mvc;
namespace APH.SiteHub.Api.Http;

/// <summary>Adapts the transport-agnostic <see cref="IResult"/> built from a Result to an MVC action result.</summary>
public sealed class ResultActionResult(IResult inner) : IActionResult
{
    public Task ExecuteResultAsync(ActionContext context) => inner.ExecuteAsync(context.HttpContext);
}
