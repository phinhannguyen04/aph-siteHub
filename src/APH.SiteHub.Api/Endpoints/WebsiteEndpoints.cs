using APH.SiteHub.Api.Contracts;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Api.Security;
using APH.SiteHub.Application.Websites;

namespace APH.SiteHub.Api.Endpoints;

public static class WebsiteEndpoints
{
    public static void MapWebsiteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/websites")
            .RequireAuthorization()
            .AddEndpointFilter<CsrfFilter>()
            .WithTags("Websites");
        group.MapGet("", ListWebsitesAsync);
        group.MapGet("/count", CountWebsitesAsync);
        group.MapPost("", CreateWebsiteAsync);
        group.MapPatch("/{id}", UpdateWebsiteAsync);
    }

    private static async Task<IResult> ListWebsitesAsync(HttpRequest request, ListWebsitesHandler handler, CancellationToken ct)
    {
        return (
            await WebsiteListQueryParser.Parse(request.Query)
                .BindAsync(
                    query => handler.HandleAsync(
                        query,
                        ct
                    )
                )
        ).ToHttpResult();
    }

    private static async Task<IResult> CountWebsitesAsync(CountWebsitesHandler handler, CancellationToken ct)
    {
        return (
            await handler.HandleAsync(
                new(),
                ct
            )
        ).ToHttpResult(count => new { count });
    }

    private static async Task<IResult> CreateWebsiteAsync(HttpRequest request, CreateWebsiteHandler handler, CancellationToken ct)
    {
        return (
            await (
                await RequestBody.ReadAsync(
                    request,
                    ct,
                    [
                        new("name", Required: true),
                        new("url", Required: true),
                        new("tag_ids", RequestFieldType.StringArray)
                    ]
                )
            ).BindAsync(
                body => handler.HandleAsync(
                    new(
                        body.Text("name"),
                        body.Text("url"),
                        body.Strings("tag_ids")
                    ),
                    ct
                )
            )
        ).ToHttpResult(website => new { website }, 201);
    }

    private static async Task<IResult> UpdateWebsiteAsync(string id, HttpRequest request, UpdateWebsiteHandler handler, CancellationToken ct)
    {
        return (
            await (
                await RequestBody.ReadAsync(
                    request,
                    ct,
                    [
                        new("name"),
                        new("url"),
                        new("tag_ids", RequestFieldType.StringArray)
                    ]
                )
            ).BindAsync(
                body => handler.HandleAsync(
                    new(
                        id,
                        body.Text("name"),
                        body.Text("url"),
                        body.Strings("tag_ids")
                    ),
                    ct
                )
            )
        ).ToHttpResult(website => new { website });
    }
}
