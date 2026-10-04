using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserLimitation> UserLimitations { get; }
    DbSet<LimitationTip> LimitationTips { get; }
    DbSet<MuscleGroup> MuscleGroups { get; }
    DbSet<Exercise> Exercises { get; }
    DbSet<Routine> Routines { get; }
    DbSet<RoutineDay> RoutineDays { get; }
    DbSet<RoutineExercise> RoutineExercises { get; }
    DbSet<UserRoutine> UserRoutines { get; }
    DbSet<WorkoutSession> WorkoutSessions { get; }
    DbSet<WorkoutSet> WorkoutSets { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
