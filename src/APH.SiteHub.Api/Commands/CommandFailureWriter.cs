using APH.SiteHub.Application;
namespace APH.SiteHub.Api.Commands;

public static class CommandFailureWriter
{
    public static void Write(Error error)
    {
        Console.Error.WriteLine($"{error.Code}: {error.Message}");
        Environment.ExitCode = 1;
    }
}
