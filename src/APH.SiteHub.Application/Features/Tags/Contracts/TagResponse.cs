using APH.SiteHub.Domain;

namespace APH.SiteHub.Application.Tags;

public sealed record TagResponse(string Id, string Name, string Description, string Color, string CreatedAt, string UpdatedAt)
{
    public static TagResponse From(Tag tag) => new(tag.Id, tag.Name, tag.Description, tag.Color, tag.CreatedAt, tag.UpdatedAt);
}
