using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Infrastructure.Persistence;
using APH.SiteHub.Infrastructure.Security;
using Microsoft.Extensions.DependencyInjection;
namespace APH.SiteHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, SiteHubOptions options)
    {
        services.AddSingleton(options);
        services.AddScoped<DatabaseOperation>();
        services.AddScoped<DbSession>();
        services.AddScoped<DatabaseMigrator>();
        services.AddScoped<IWebsiteRepository, WebsiteRepository>();
        services.AddScoped<ITagRepository, TagRepository>();
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<ICredentialRepository, CredentialRepository>();
        services.AddSingleton<IPasswordHasher, ArgonPasswordHasher>();
        services.AddSingleton<ISecretProtector, SecretProtector>();
        return services;
    }
}
