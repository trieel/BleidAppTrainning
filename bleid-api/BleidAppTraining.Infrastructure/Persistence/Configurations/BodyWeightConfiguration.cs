using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BleidAppTraining.Infrastructure.Persistence.Configurations;

public class BodyWeightEntryConfiguration : IEntityTypeConfiguration<BodyWeightEntry>
{
    public void Configure(EntityTypeBuilder<BodyWeightEntry> builder)
    {
        builder.ToTable("body_weight_entries");
        builder.Property(entry => entry.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(entry => entry.WeightKg).HasPrecision(6, 2);
        builder.Property(entry => entry.Notes).HasMaxLength(500);
        builder.Property(entry => entry.CreatedAt).HasDefaultValueSql("now()");
        builder.HasIndex(entry => new { entry.UserId, entry.Date });
        builder.HasOne(entry => entry.User)
            .WithMany()
            .HasForeignKey(entry => entry.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
