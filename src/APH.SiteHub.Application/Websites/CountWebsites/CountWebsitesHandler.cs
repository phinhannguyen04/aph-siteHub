using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Websites;

public sealed class CountWebsitesHandler(IWebsiteRepository repository) : IHandler<CountWebsitesQuery, int>
{
    public Task<Result<int>> HandleAsync(CountWebsitesQuery query, CancellationToken ct) => repository.CountAsync(ct);
}
