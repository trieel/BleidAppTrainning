using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BleidAppTraining.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", table =>
        {
            table.HasCheckConstraint("ck_users_age", "age IS NULL OR age BETWEEN 13 AND 100");
            table.HasCheckConstraint("ck_users_days_per_week", "days_per_week IS NULL OR days_per_week BETWEEN 2 AND 6");
            table.HasCheckConstraint("ck_users_session_min", "session_min IS NULL OR session_min IN (30, 45, 60)");
        });
        builder.Property(user => user.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(user => user.FullName).HasMaxLength(150).IsRequired();
        builder.Property(user => user.AvatarUrl).HasMaxLength(500);
        builder.Property(user => user.CreatedAt).HasDefaultValueSql("now()");
        builder.Property(user => user.Sex).HasConversion<string>().HasMaxLength(20);
        builder.Property(user => user.Goal).HasConversion<string>().HasMaxLength(30);
        builder.Property(user => user.Level).HasConversion<string>().HasMaxLength(30);
        builder.HasIndex(user => user.Email).IsUnique();
    }
}
