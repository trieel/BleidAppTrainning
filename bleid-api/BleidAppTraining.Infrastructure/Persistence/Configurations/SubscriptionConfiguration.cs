using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BleidAppTraining.Infrastructure.Persistence.Configurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.ToTable("subscriptions");
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.ExternalPreapprovalId).HasMaxLength(100);
        builder.Property(s => s.PayerEmail).HasMaxLength(256).IsRequired();
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(s => s.Amount).HasPrecision(18, 2);
        builder.Property(s => s.CurrencyId).HasMaxLength(10).HasDefaultValue("ARS");
        builder.Property(s => s.CreatedAt).HasDefaultValueSql("now()");
        builder.Property(s => s.UpdatedAt).HasDefaultValueSql("now()");

        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.ExternalPreapprovalId);

        builder.HasOne(s => s.User)
            .WithMany(u => u.Subscriptions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
