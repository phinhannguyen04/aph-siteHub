using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Api.Commands;

public static class ResetPasswordCommand
{
    public static async Task<Result> RunAsync(IServiceProvider services)
    {
        var password = Normalize.Password(Console.ReadLine(), 12);
        if (password.IsFailure)
        {
            return password;
        }
        await using var scope = services.CreateAsyncScope();
        var hash = scope.ServiceProvider.GetRequiredService<IPasswordHasher>().Hash(password.Value);
        if (hash.IsFailure)
        {
            return hash;
        }
        var result = await scope.ServiceProvider.GetRequiredService<ICredentialRepository>().ForceSetAsync(hash.Value, CancellationToken.None);
        if (result.IsSuccess)
        {
            Console.WriteLine("Administrator password reset; existing sessions revoked.");
        }
        return result;
    }
}
