using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Tags;

public sealed class DeleteTagHandler(ITagRepository repository) : IHandler<DeleteTagCommand, bool>
{
    public async Task<Result<bool>> HandleAsync(DeleteTagCommand command, CancellationToken ct) =>
        (await repository.DeleteAsync(command.Id, ct)).Bind(deleted => deleted
            ? Result<bool>.Success(true) : Result<bool>.Failure(Error.Missing("Tag")));
}
