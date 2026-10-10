using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace APH.SiteHub.Infrastructure.Persistence.Configurations;

public sealed class WebsiteTagConfiguration : IEntityTypeConfiguration<WebsiteTag>
{
    public void Configure(EntityTypeBuilder<WebsiteTag> builder)
    {
        builder.ToTable("website_tags");
        builder.HasKey(x => new { x.WebsiteId, x.TagId }).HasName("website_tags_website_id_tag_id_pk");
        builder.Property(x => x.WebsiteId).HasColumnName("website_id");
        builder.Property(x => x.TagId).HasColumnName("tag_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.HasIndex(x => x.TagId).HasDatabaseName("website_tags_tag_idx");
        builder.HasOne<Website>().WithMany(x => x.Links).HasForeignKey(x => x.WebsiteId).OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("website_tags_website_id_websites_website_id_fk");
        builder.HasOne(x => x.Tag).WithMany().HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("website_tags_tag_id_tags_tag_id_fk");
    }
}
