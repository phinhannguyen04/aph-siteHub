using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Websites;

public sealed class DeleteWebsiteHandler(IWebsiteRepository repository) : IHandler<DeleteWebsiteCommand, bool>
{
    public async Task<Result<bool>> HandleAsync(DeleteWebsiteCommand command, CancellationToken ct) =>
        (await repository.DeleteAsync(command.Id, ct)).Bind(deleted => deleted
            ? Result<bool>.Success(true) : Result<bool>.Failure(Error.Missing("Website")));
}
