using System.Security.Cryptography;
using System.Text;
using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Infrastructure.Security;

public sealed class SecretProtector(SiteHubOptions options) : ISecretProtector
{
    private Result<byte[]> Key() => string.IsNullOrEmpty(options.EncryptionKey) || options.EncryptionKey.Length != 64 || !options.EncryptionKey.All(Uri.IsHexDigit)
        ? Result<byte[]>.Failure(Error.Configuration("ACCOUNT_ENCRYPTION_KEY must contain 64 hexadecimal characters"))
        : SecurityOperation.Execute(() => Convert.FromHexString(options.EncryptionKey));
    public Result<string> Encrypt(string accountId, string secret) => Key().Bind(key => SecurityOperation.Execute(() =>
    {
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plain = Encoding.UTF8.GetBytes(secret);
        var encrypted = new byte[plain.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(key, 16);
        aes.Encrypt(nonce, plain, encrypted, tag, Encoding.UTF8.GetBytes(accountId));
        return string.Join('.', "v1", Base64Url.Encode(nonce), Base64Url.Encode(tag), Base64Url.Encode(encrypted));
    }));
    public Result<string> Decrypt(string accountId, string envelope) => Key().Bind(key =>
    {
        var parts = envelope.Split('.');
        if (parts.Length != 4 || parts[0] != "v1")
        {
            return Result<string>.Failure(Error.Unexpected());
        }
        return SecurityOperation.Execute(() =>
        {
            var cipher = Base64Url.Decode(parts[3]);
            var plain = new byte[cipher.Length];
            using var aes = new AesGcm(key, 16);
            aes.Decrypt(Base64Url.Decode(parts[1]), cipher, Base64Url.Decode(parts[2]), plain, Encoding.UTF8.GetBytes(accountId));
            return Encoding.UTF8.GetString(plain);
        });
    });
}
