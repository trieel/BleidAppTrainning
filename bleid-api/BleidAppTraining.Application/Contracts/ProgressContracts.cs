namespace BleidAppTraining.Application.Contracts;

public sealed record VolumeProgressResult(DateOnly WeekStart, decimal TotalVolumeKg);

public sealed record ExerciseProgressResult(
    DateOnly Date,
    decimal MaxWeightKg,
    int TotalReps,
    decimal TotalVolumeKg);

public sealed record StreakResult(int CurrentDays, int LongestDays, DateOnly? LastWorkoutDate);

public sealed record ExercisePerformanceSetResult(
    int SetNumber,
    int Reps,
    decimal WeightKg,
    bool Completed);

public sealed record ExerciseLatestPerformanceResult(
    Guid ExerciseId,
    DateOnly Date,
    decimal MaxWeightKg,
    int TotalReps,
    decimal TotalVolumeKg,
    IReadOnlyCollection<ExercisePerformanceSetResult> Sets);
