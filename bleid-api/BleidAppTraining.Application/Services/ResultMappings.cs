using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Domain.Entities;

namespace BleidAppTraining.Application.Services;

public static class ResultMappings
{
    public static UserProfileResult User(User user) => new(
        user.Id,
        user.Email ?? string.Empty,
        user.FullName,
        user.AvatarUrl,
        user.Age,
        user.Sex,
        user.Goal,
        user.Level,
        user.DaysPerWeek,
        user.SessionMin,
        user.Limitations
            .OrderBy(limitation => limitation.Type)
            .Select(limitation => new UserLimitationResult(limitation.Type, limitation.Severity))
            .ToArray());

    public static RoutineResult Routine(Routine routine) => new(
        routine.Id,
        routine.Name,
        routine.Goal,
        routine.Level,
        routine.DaysPerWeek,
        routine.IsTemplate,
        routine.Days
            .OrderBy(day => day.Order)
            .ThenBy(day => day.DayNumber)
            .Select(day => new RoutineDayResult(
                day.Id,
                day.DayNumber,
                day.Name,
                day.Order,
                day.Exercises
                    .OrderBy(exercise => exercise.Order)
                    .Select(exercise => new RoutineExerciseResult(
                        exercise.Id,
                        exercise.ExerciseId,
                        exercise.Exercise?.Name ?? string.Empty,
                        exercise.Sets,
                        exercise.RepsMin,
                        exercise.RepsMax,
                        exercise.RestSeconds,
                        exercise.Order))
                    .ToArray()))
            .ToArray());

    public static WorkoutSessionResult Session(WorkoutSession session) => new(
        session.Id,
        session.RoutineDayId,
        session.RoutineDay?.Name ?? string.Empty,
        session.StartedAt,
        session.FinishedAt,
        session.Notes,
        session.Sets
            .OrderBy(set => set.ExerciseId)
            .ThenBy(set => set.SetNumber)
            .Select(set => new WorkoutSetResult(
                set.Id,
                set.ExerciseId,
                set.Exercise?.Name ?? string.Empty,
                set.SetNumber,
                set.Reps,
                set.WeightKg,
                set.Completed,
                set.CreatedAt))
            .ToArray());
}
