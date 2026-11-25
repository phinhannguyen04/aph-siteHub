using APH.SiteHub.Api.Contracts;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Application.Tags;
using Microsoft.AspNetCore.Mvc;

namespace APH.SiteHub.Api.Controllers;

[ApiController]
[Route("api/tags")]
public sealed class TagsController : ControllerBase
{
    private static readonly RequestField[] Fields =
    [
        new("name", Required: true),
        new("description", AllowNull: true),
        new("color", Required: true)
    ];

    [HttpGet]
    public async Task<IActionResult> List([FromServices] ListTagsHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(), ct)).ToActionResult(tags => new { tags });

    [HttpPost]
    public async Task<IActionResult> Create([FromServices] SaveTagHandler handler, CancellationToken ct) =>
        (await (await RequestBody.ReadAsync(Request, ct, Fields)).BindAsync(
            body => handler.HandleAsync(new(null, body.Text("name"), body.Text("description"), body.Text("color")), ct)
        )).ToActionResult(tag => new { tag }, 201);

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromServices] SaveTagHandler handler, CancellationToken ct) =>
        (await (await RequestBody.ReadAsync(Request, ct, Fields)).BindAsync(
            body => handler.HandleAsync(new(id, body.Text("name"), body.Text("description"), body.Text("color")), ct)
        )).ToActionResult(tag => new { tag });

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, [FromServices] DeleteTagHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(id), ct)).ToActionResult(ok => new { ok });
}
