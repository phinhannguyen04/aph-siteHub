using APH.SiteHub.Api.Contracts;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Application.Websites;
using Microsoft.AspNetCore.Mvc;

namespace APH.SiteHub.Api.Controllers;

[ApiController]
[Route("api/websites")]
public sealed class WebsitesController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromServices] ListWebsitesHandler handler, CancellationToken ct) =>
        (await WebsiteListQueryParser.Parse(Request.Query).BindAsync(query => handler.HandleAsync(query, ct))).ToActionResult();

    [HttpGet("count")]
    public async Task<IActionResult> Count([FromServices] CountWebsitesHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(), ct)).ToActionResult(count => new { count });

    [HttpPost]
    public async Task<IActionResult> Create([FromServices] CreateWebsiteHandler handler, CancellationToken ct) =>
        (await (await RequestBody.ReadAsync(
            Request,
            ct,
            [
                new("name", Required: true),
                new("url", Required: true),
                new("tag_ids", RequestFieldType.StringArray)
            ]
        )).BindAsync(body => handler.HandleAsync(new(body.Text("name"), body.Text("url"), body.Strings("tag_ids")), ct)))
        .ToActionResult(website => new { website }, 201);

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromServices] UpdateWebsiteHandler handler, CancellationToken ct) =>
        (await (await RequestBody.ReadAsync(
            Request,
            ct,
            [
                new("name"),
                new("url"),
                new("tag_ids", RequestFieldType.StringArray)
            ]
        )).BindAsync(body => handler.HandleAsync(new(id, body.Text("name"), body.Text("url"), body.Strings("tag_ids")), ct)))
        .ToActionResult(website => new { website });

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, [FromServices] DeleteWebsiteHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(id), ct)).ToActionResult(ok => new { ok });
}
