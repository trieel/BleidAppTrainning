using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BleidAppTraining.Infrastructure.Persistence.Configurations;

public class RoutineConfiguration : IEntityTypeConfiguration<Routine>
{
    public void Configure(EntityTypeBuilder<Routine> builder)
    {
        builder.ToTable("routines");
        builder.Property(routine => routine.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(routine => routine.Name).HasMaxLength(150).IsRequired();
        builder.Property(routine => routine.Goal).HasConversion<string>().HasMaxLength(30);
        builder.Property(routine => routine.Level).HasConversion<string>().HasMaxLength(30);
        builder.Property(routine => routine.CreatedAt).HasDefaultValueSql("now()");
        builder.HasIndex(routine => new { routine.Goal, routine.Level, routine.DaysPerWeek, routine.IsTemplate });
        builder.HasOne(routine => routine.Creator)
            .WithMany(user => user.CreatedRoutines)
            .HasForeignKey(routine => routine.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class RoutineDayConfiguration : IEntityTypeConfiguration<RoutineDay>
{
    public void Configure(EntityTypeBuilder<RoutineDay> builder)
    {
        builder.ToTable("routine_days");
        builder.Property(day => day.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(day => day.Name).HasMaxLength(100).IsRequired();
        builder.HasIndex(day => new { day.RoutineId, day.DayNumber }).IsUnique();
        builder.HasOne(day => day.Routine)
            .WithMany(routine => routine.Days)
            .HasForeignKey(day => day.RoutineId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RoutineExerciseConfiguration : IEntityTypeConfiguration<RoutineExercise>
{
    public void Configure(EntityTypeBuilder<RoutineExercise> builder)
    {
        builder.ToTable("routine_exercises");
        builder.Property(exercise => exercise.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.HasIndex(exercise => new { exercise.RoutineDayId, exercise.Order }).IsUnique();
        builder.HasOne(exercise => exercise.RoutineDay)
            .WithMany(day => day.Exercises)
            .HasForeignKey(exercise => exercise.RoutineDayId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(exercise => exercise.Exercise)
            .WithMany(exercise => exercise.RoutineExercises)
            .HasForeignKey(exercise => exercise.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class UserRoutineConfiguration : IEntityTypeConfiguration<UserRoutine>
{
    public void Configure(EntityTypeBuilder<UserRoutine> builder)
    {
        builder.ToTable("user_routines");
        builder.Property(routine => routine.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(routine => routine.AssignedAt).HasDefaultValueSql("now()");
        builder.HasIndex(routine => new { routine.UserId, routine.RoutineId }).IsUnique();
        builder.HasOne(routine => routine.User)
            .WithMany(user => user.Routines)
            .HasForeignKey(routine => routine.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(routine => routine.Routine)
            .WithMany(routine => routine.UserRoutines)
            .HasForeignKey(routine => routine.RoutineId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
