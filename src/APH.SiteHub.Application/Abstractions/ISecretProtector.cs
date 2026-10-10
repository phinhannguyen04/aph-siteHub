namespace APH.SiteHub.Application.Abstractions;

public interface ISecretProtector
{
    Result<string> Encrypt(string accountId, string secret);
    Result<string> Decrypt(string accountId, string envelope);
}
