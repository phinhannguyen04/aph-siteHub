using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace APH.SiteHub.Infrastructure.Persistence.Configurations;

public sealed class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("accounts");
        builder.HasKey(x => x.Id).HasName("accounts_pkey");
        builder.Property(x => x.Id).HasColumnName("account_id");
        builder.Property(x => x.Provider).HasColumnName("provider");
        builder.Property(x => x.LoginName).HasColumnName("name");
        builder.Property(x => x.ExternalAccountId).HasColumnName("external_account_id");
        builder.Property(x => x.Email).HasColumnName("email");
        builder.Property(x => x.Password).HasColumnName("password");
        builder.Property(x => x.SecretKeyEncrypted).HasColumnName("secret_key_encrypted");
        builder.Property(x => x.IsLimit).HasColumnName("is_limit").HasDefaultValue(false);
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.HasIndex(x => new { x.Provider, x.ExternalAccountId }).IsUnique().HasDatabaseName("accounts_provider_external_id_unique");
    }
}
