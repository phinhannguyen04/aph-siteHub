using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using Isopoh.Cryptography.Argon2;
namespace APH.SiteHub.Infrastructure.Security;

public sealed class ArgonPasswordHasher : IPasswordHasher
{
    public Result<string> Hash(string password) => SecurityOperation.Execute(() => Argon2.Hash(password, type: Argon2Type.HybridAddressing, timeCost: 2, memoryCost: 65536, parallelism: 1));
    public Result<bool> Verify(string password, string hash) => SecurityOperation.Execute(() => Argon2.Verify(hash, password));
}
