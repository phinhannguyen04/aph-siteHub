using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<SiteHubDbContext>
{
    public SiteHubDbContext CreateDbContext(string[] args)
    {
        // Scaffolding is offline. database update requires an explicit DATABASE_URL.
        var url = Environment.GetEnvironmentVariable("DATABASE_URL");
        var connection = string.IsNullOrEmpty(url) ? "Host=localhost;Database=sitehub;Username=sitehub" : SiteHubOptions.Read(
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DATABASE_URL"] = url,
                ["SESSION_SECRET"] = new string('x', 32),
                ["APP_ORIGIN"] = "http://localhost"
            }).Build()).ConnectionString;
        return new(new DbContextOptionsBuilder<SiteHubDbContext>().UseNpgsql(connection).Options);
    }
}
