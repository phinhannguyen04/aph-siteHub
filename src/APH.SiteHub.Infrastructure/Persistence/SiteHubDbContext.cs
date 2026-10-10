using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class SiteHubDbContext(DbContextOptions<SiteHubDbContext> options) : DbContext(options)
{
    public DbSet<Website> Websites => Set<Website>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<WebsiteTag> WebsiteTags => Set<WebsiteTag>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<AdminCredential> Credentials => Set<AdminCredential>();
    protected override void OnModelCreating(ModelBuilder model) =>
        model.ApplyConfigurationsFromAssembly(typeof(SiteHubDbContext).Assembly);
}
