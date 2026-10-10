using Microsoft.Extensions.DependencyInjection;
using APH.SiteHub.Application.Accounts;
using APH.SiteHub.Application.Auth;
using APH.SiteHub.Application.Tags;
using APH.SiteHub.Application.Websites;
namespace APH.SiteHub.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services) => services
        .AddScoped<AuthService>().AddScoped<ListWebsitesHandler>().AddScoped<CreateWebsiteHandler>()
        .AddScoped<UpdateWebsiteHandler>().AddScoped<SaveTagHandler>()
        .AddScoped<CreateAccountHandler>().AddScoped<UpdateAccountHandler>()
        .AddScoped<CountWebsitesHandler>().AddScoped<ListTagsHandler>().AddScoped<DeleteTagHandler>()
        .AddScoped<ListAccountsHandler>().AddScoped<GetAccountHandler>().AddScoped<AccountStatsHandler>()
        .AddScoped<GetAccountSecretHandler>().AddScoped<DeleteAccountHandler>();
}
