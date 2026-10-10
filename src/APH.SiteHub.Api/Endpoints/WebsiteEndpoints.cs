using APH.SiteHub.Api.Contracts;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Api.Security;
using APH.SiteHub.Application.Websites;
namespace APH.SiteHub.Api.Endpoints;

public static class WebsiteEndpoints
{
    public static void MapWebsiteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/websites").RequireAuthorization().AddEndpointFilter<CsrfFilter>().WithTags("Websites");
        group.MapGet("", async (HttpRequest request, ListWebsitesHandler handler, CancellationToken ct) =>
            (await WebsiteListQueryParser.Parse(request.Query).BindAsync(query => handler.HandleAsync(query, ct))).ToHttpResult());
        group.MapGet("/count", async (CountWebsitesHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(new(), ct)).ToHttpResult(count => new { count }));
        group.MapPost("", async (HttpRequest request, CreateWebsiteHandler handler, CancellationToken ct) =>
            (await (await RequestBody.ReadAsync(request, ct, [new("name", Required: true), new("url", Required: true), new("tag_ids", RequestFieldType.StringArray)]))
                .BindAsync(body => handler.HandleAsync(new(body.Text("name"), body.Text("url"), body.Strings("tag_ids")), ct)))
                .ToHttpResult(website => new { website }, 201));
        group.MapPatch("/{id}", async (string id, HttpRequest request, UpdateWebsiteHandler handler, CancellationToken ct) =>
            (await (await RequestBody.ReadAsync(request, ct, [new("name"), new("url"), new("tag_ids", RequestFieldType.StringArray)]))
                .BindAsync(body => handler.HandleAsync(new(id, body.Text("name"), body.Text("url"), body.Strings("tag_ids")), ct)))
                .ToHttpResult(website => new { website }));
    }
}
