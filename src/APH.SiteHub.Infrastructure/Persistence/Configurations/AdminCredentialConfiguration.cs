using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace APH.SiteHub.Infrastructure.Persistence.Configurations;

public sealed class AdminCredentialConfiguration : IEntityTypeConfiguration<AdminCredential>
{
    public void Configure(EntityTypeBuilder<AdminCredential> builder)
    {
        builder.ToTable("admin_credentials");
        builder.HasKey(x => x.Id).HasName("admin_credentials_pkey");
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.PasswordHash).HasColumnName("password_hash");
        builder.Property(x => x.Version).HasColumnName("version").IsConcurrencyToken();
    }
}
