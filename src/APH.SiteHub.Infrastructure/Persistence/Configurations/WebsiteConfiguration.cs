using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace APH.SiteHub.Infrastructure.Persistence.Configurations;

public sealed class WebsiteConfiguration : IEntityTypeConfiguration<Website>
{
    public void Configure(EntityTypeBuilder<Website> builder)
    {
        builder.ToTable("websites");
        builder.HasKey(x => x.Id).HasName("websites_pkey");
        builder.Property(x => x.Id).HasColumnName("website_id");
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.Url).HasColumnName("url");
        builder.Property(x => x.SearchText).HasColumnName("search_text");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => new { x.CreatedAt, x.Id }).HasDatabaseName("websites_created_id_idx");
    }
}
