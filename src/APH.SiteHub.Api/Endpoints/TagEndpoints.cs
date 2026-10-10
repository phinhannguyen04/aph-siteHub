using APH.SiteHub.Api.Http;
using APH.SiteHub.Api.Security;
using APH.SiteHub.Application.Tags;

namespace APH.SiteHub.Api.Endpoints;

public static class TagEndpoints
{
    public static void MapTagEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/tags")
            .RequireAuthorization()
            .AddEndpointFilter<CsrfFilter>()
            .WithTags("Tags");
        group.MapGet("", ListTagsAsync);
        group.MapPost("", CreateTagAsync);
        group.MapPatch("/{id}", UpdateTagAsync);
        group.MapDelete("/{id}", DeleteTagAsync);
    }

    private static async Task<IResult> ListTagsAsync(ListTagsHandler handler, CancellationToken ct)
    {
        return (
            await handler.HandleAsync(
                new(),
                ct
            )
        ).ToHttpResult(tags => new { tags });
    }

    private static async Task<IResult> CreateTagAsync(HttpRequest request, SaveTagHandler handler, CancellationToken ct)
    {
        return (
            await (
                await RequestBody.ReadAsync(
                    request,
                    ct,
                    [
                        new("name", Required: true),
                        new("description", AllowNull: true),
                        new("color", Required: true)
                    ]
                )
            ).BindAsync(
                body => handler.HandleAsync(
                    new(
                        null,
                        body.Text("name"),
                        body.Text("description"),
                        body.Text("color")
                    ),
                    ct
                )
            )
        ).ToHttpResult(tag => new { tag }, 201);
    }

    private static async Task<IResult> UpdateTagAsync(string id, HttpRequest request, SaveTagHandler handler, CancellationToken ct)
    {
        return (
            await (
                await RequestBody.ReadAsync(
                    request,
                    ct,
                    [
                        new("name", Required: true),
                        new("description", AllowNull: true),
                        new("color", Required: true)
                    ]
                )
            ).BindAsync(
                body => handler.HandleAsync(
                    new(
                        id,
                        body.Text("name"),
                        body.Text("description"),
                        body.Text("color")
                    ),
                    ct
                )
            )
        ).ToHttpResult(tag => new { tag });
    }

    private static async Task<IResult> DeleteTagAsync(string id, DeleteTagHandler handler, CancellationToken ct)
    {
        return (
            await handler.HandleAsync(
                new(id),
                ct
            )
        ).ToHttpResult(ok => new { ok });
    }
}
