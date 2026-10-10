using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace APH.SiteHub.Infrastructure.Persistence.Configurations;

public sealed class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("tags");
        builder.HasKey(x => x.Id).HasName("tags_pkey");
        builder.Property(x => x.Id).HasColumnName("tag_id");
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.NameKey).HasColumnName("name_key");
        builder.Property(x => x.Description).HasColumnName("description");
        builder.Property(x => x.Color).HasColumnName("color");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => x.NameKey).IsUnique().HasDatabaseName("tags_name_key_unique");
    }
}
