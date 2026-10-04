using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BleidAppTraining.Infrastructure.Persistence.Configurations;

public class MuscleGroupConfiguration : IEntityTypeConfiguration<MuscleGroup>
{
    public void Configure(EntityTypeBuilder<MuscleGroup> builder)
    {
        builder.ToTable("muscle_groups");
        builder.Property(group => group.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(group => group.Name).HasMaxLength(80).IsRequired();
        builder.Property(group => group.Icon).HasMaxLength(100);
        builder.HasIndex(group => group.Name).IsUnique();
    }
}

public class ExerciseConfiguration : IEntityTypeConfiguration<Exercise>
{
    public void Configure(EntityTypeBuilder<Exercise> builder)
    {
        builder.ToTable("exercises");
        builder.Property(exercise => exercise.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(exercise => exercise.Name).HasMaxLength(120).IsRequired();
        builder.Property(exercise => exercise.Description).HasMaxLength(2000).IsRequired();
        builder.Property(exercise => exercise.Equipment).HasConversion<string>().HasMaxLength(30);
        builder.Property(exercise => exercise.Level).HasConversion<string>().HasMaxLength(30);
        builder.Property(exercise => exercise.Contraindications).HasColumnType("text[]");
        builder.Property(exercise => exercise.ModificationTip).HasMaxLength(1000);
        builder.Property(exercise => exercise.ImageUrl).HasMaxLength(500);
        builder.HasIndex(exercise => new { exercise.MuscleGroupId, exercise.Name }).IsUnique();
        builder.HasOne(exercise => exercise.MuscleGroup)
            .WithMany(group => group.Exercises)
            .HasForeignKey(exercise => exercise.MuscleGroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class LimitationTipConfiguration : IEntityTypeConfiguration<LimitationTip>
{
    public void Configure(EntityTypeBuilder<LimitationTip> builder)
    {
        builder.ToTable("limitation_tips");
        builder.Property(tip => tip.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(tip => tip.LimitationType).HasConversion<string>().HasMaxLength(30);
        builder.Property(tip => tip.Title).HasMaxLength(150).IsRequired();
        builder.Property(tip => tip.Content).HasMaxLength(2000).IsRequired();
        builder.Property(tip => tip.TipType).HasConversion<string>().HasMaxLength(30);
    }
}

public class UserLimitationConfiguration : IEntityTypeConfiguration<UserLimitation>
{
    public void Configure(EntityTypeBuilder<UserLimitation> builder)
    {
        builder.ToTable("user_limitations");
        builder.Property(limitation => limitation.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(limitation => limitation.Type).HasConversion<string>().HasMaxLength(30);
        builder.Property(limitation => limitation.Severity).HasConversion<string>().HasMaxLength(30);
        builder.Property(limitation => limitation.CreatedAt).HasDefaultValueSql("now()");
        builder.HasIndex(limitation => new { limitation.UserId, limitation.Type }).IsUnique();
        builder.HasOne(limitation => limitation.User)
            .WithMany(user => user.Limitations)
            .HasForeignKey(limitation => limitation.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
