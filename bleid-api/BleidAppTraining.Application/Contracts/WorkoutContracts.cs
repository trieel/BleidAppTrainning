namespace BleidAppTraining.Application.Contracts;

public sealed class StartSessionCommand
{
    public Guid RoutineDayId { get; set; }
}

public sealed class RegisterSetCommand
{
    public Guid ExerciseId { get; set; }
    public int SetNumber { get; set; }
    public int Reps { get; set; }
    public decimal WeightKg { get; set; }
    public bool Completed { get; set; } = true;
}

public sealed class EndSessionCommand
{
    public string? Notes { get; set; }
}

public sealed record WorkoutSetResult(
    Guid Id,
    Guid ExerciseId,
    string ExerciseName,
    int SetNumber,
    int Reps,
    decimal WeightKg,
    bool Completed,
    DateTime CreatedAt);

public sealed record WorkoutSessionResult(
    Guid Id,
    Guid RoutineDayId,
    string RoutineDayName,
    DateTime StartedAt,
    DateTime? FinishedAt,
    string? Notes,
    IReadOnlyCollection<WorkoutSetResult> Sets);
