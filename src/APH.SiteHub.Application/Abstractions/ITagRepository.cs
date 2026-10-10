using APH.SiteHub.Domain;

namespace APH.SiteHub.Application.Abstractions;

public interface ITagRepository
{
    Task<Result<List<Tag>>> ListAsync(CancellationToken ct);
    Task<Result<Tag>> SaveAsync(Tag tag, bool create, CancellationToken ct);
    Task<Result<bool>> DeleteAsync(string id, CancellationToken ct);
}
