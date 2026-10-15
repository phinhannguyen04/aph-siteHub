using APH.SiteHub.Domain;
using APH.SiteHub.Application.Tags;

namespace APH.SiteHub.Application.Websites;

public sealed record WebsiteResponse(string Id, string Name, string Url, string[] TagIds, TagResponse[] Tags, string CreatedAt, string UpdatedAt)
{
    public static WebsiteResponse From(Website website)
    {
        var tags = website.Links.OrderBy(l => l.Position).Select(l => TagResponse.From(l.Tag)).ToArray();
        return new(website.Id, website.Name, website.Url, tags.Select(t => t.Id).ToArray(), tags, website.CreatedAt, website.UpdatedAt);
    }
}
