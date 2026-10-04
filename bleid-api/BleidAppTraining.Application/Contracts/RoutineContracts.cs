using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Application.Contracts;

public sealed class CustomizeRoutineCommand
{
    public Guid TemplateId { get; set; }
}

public sealed class UpdateRoutineDayCommand
{
    public string? Name { get; set; }
    public int? Order { get; set; }
}

public sealed class AddRoutineExerciseCommand
{
    public Guid ExerciseId { get; set; }
    public int Sets { get; set; }
    public int RepsMin { get; set; }
    public int RepsMax { get; set; }
    public int RestSeconds { get; set; }
}

public sealed record RoutineResult(
    Guid Id,
    string Name,
    GoalType Goal,
    LevelType Level,
    int DaysPerWeek,
    bool IsTemplate,
    IReadOnlyCollection<RoutineDayResult> Days);

public sealed record RoutineDayResult(
    Guid Id,
    int DayNumber,
    string Name,
    int Order,
    IReadOnlyCollection<RoutineExerciseResult> Exercises);

public sealed record RoutineExerciseResult(
    Guid Id,
    Guid ExerciseId,
    string ExerciseName,
    int Sets,
    int RepsMin,
    int RepsMax,
    int RestSeconds,
    int Order);
