namespace APH.SiteHub.Application.Abstractions;

public interface IPasswordHasher
{
    Result<string> Hash(string password);
    Result<bool> Verify(string password, string hash);
}
