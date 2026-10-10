using APH.SiteHub.Domain;
using APH.SiteHub.Application.Websites;

namespace APH.SiteHub.Application.Abstractions;

public interface IWebsiteRepository
{
    Task<Result<WebsitePage>> ListAsync(ListWebsitesQuery query, CancellationToken ct);
    Task<Result<int>> CountAsync(CancellationToken ct);
    Task<Result<Website>> CreateAsync(Website website, string[] tags, CancellationToken ct);
    Task<Result<Website?>> UpdateAsync(UpdateWebsiteCommand command, CancellationToken ct);
}
