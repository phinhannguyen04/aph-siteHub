using System.Text;
using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure.Security;
namespace APH.SiteHub.Api.Commands;

public static class HashPasswordCommand
{
    public static Result Run()
    {
        var result = Normalize.Password(Console.ReadLine(), 12).Bind(password => new ArgonPasswordHasher().Hash(password));
        if (result.IsFailure)
        {
            return result;
        }
        Console.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(result.Value)));
        return Result.Success();
    }
}
