using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Accounts;

public sealed class DeleteAccountHandler(IAccountRepository repository) : IHandler<DeleteAccountCommand, bool>
{
    public async Task<Result<bool>> HandleAsync(DeleteAccountCommand command, CancellationToken ct) =>
        (await repository.DeleteAsync(command.Id, ct)).Bind(deleted => deleted
            ? Result<bool>.Success(true) : Result<bool>.Failure(Error.Missing("Account")));
}
