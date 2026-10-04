using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BleidAppTraining.Infrastructure.Persistence.Configurations;

public class WorkoutSessionConfiguration : IEntityTypeConfiguration<WorkoutSession>
{
    public void Configure(EntityTypeBuilder<WorkoutSession> builder)
    {
        builder.ToTable("workout_sessions");
        builder.Property(session => session.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(session => session.StartedAt).HasDefaultValueSql("now()");
        builder.Property(session => session.Notes).HasMaxLength(2000);
        builder.HasIndex(session => new { session.UserId, session.StartedAt });
        builder.HasOne(session => session.User)
            .WithMany(user => user.WorkoutSessions)
            .HasForeignKey(session => session.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(session => session.RoutineDay)
            .WithMany(day => day.WorkoutSessions)
            .HasForeignKey(session => session.RoutineDayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WorkoutSetConfiguration : IEntityTypeConfiguration<WorkoutSet>
{
    public void Configure(EntityTypeBuilder<WorkoutSet> builder)
    {
        builder.ToTable("workout_sets");
        builder.Property(set => set.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(set => set.WeightKg).HasPrecision(8, 2);
        builder.Property(set => set.CreatedAt).HasDefaultValueSql("now()");
        builder.HasIndex(set => new { set.SessionId, set.ExerciseId, set.SetNumber }).IsUnique();
        builder.HasOne(set => set.Session)
            .WithMany(session => session.Sets)
            .HasForeignKey(set => set.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(set => set.Exercise)
            .WithMany(exercise => exercise.WorkoutSets)
            .HasForeignKey(set => set.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
