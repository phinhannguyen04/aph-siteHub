using APH.SiteHub.Application;
namespace APH.SiteHub.Api.Commands;

public static class MaintenanceCommandDispatcher
{
    public static async Task<Result<bool>> TryRunAsync(string[] args, IServiceProvider services)
    {
        Result result;
        if (args.Contains("--migrate"))
        {
            result = await MigrateDatabaseCommand.RunAsync(services);
        }
        else if (args.Contains("--reset-password"))
        {
            result = await ResetPasswordCommand.RunAsync(services);
        }
        else
        {
            return Result<bool>.Success(false);
        }
        return result.IsSuccess ? Result<bool>.Success(true) : result.ToFailure<bool>();
    }
}
