using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Tags;

public sealed class ListTagsHandler(ITagRepository repository) : IHandler<ListTagsQuery, TagResponse[]>
{
    public async Task<Result<TagResponse[]>> HandleAsync(ListTagsQuery query, CancellationToken ct) =>
        (await repository.ListAsync(ct)).Map(tags => tags.Select(TagResponse.From).ToArray());
}
