using APH.SiteHub.Application;
namespace APH.SiteHub.Infrastructure.Security;

internal static class SecurityOperation
{
    internal static Result<T> Execute<T>(Func<T> operation)
    {
        try
        {
            return Result<T>.Success(operation());
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception) { return Result<T>.Failure(Error.Unexpected()); }
    }
}
