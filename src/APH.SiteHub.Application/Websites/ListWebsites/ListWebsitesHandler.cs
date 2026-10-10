using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Websites;

public sealed class ListWebsitesHandler(IWebsiteRepository repository) : IHandler<ListWebsitesQuery, WebsitePage>
{
    public Task<Result<WebsitePage>> HandleAsync(ListWebsitesQuery query, CancellationToken ct)
    {
        if (query.Page is < 1 or > 1000000 || query.PageSize is < 1 or > 48 || query.Search.Length > 160)
        {
            return Task.FromResult(Result<WebsitePage>.Failure(Error.Invalid("Invalid pagination or search")));
        }
        return Normalize.TagIds(query.TagIds).BindAsync(_ => repository.ListAsync(query with { Search = query.Search.Trim() }, ct));
    }
}
