namespace BleidAppTraining.Application.Contracts;

public sealed record VolumeProgressResult(DateOnly WeekStart, decimal TotalVolumeKg);

public sealed record ExerciseProgressResult(
    DateOnly Date,
    decimal MaxWeightKg,
    int TotalReps,
    decimal TotalVolumeKg);

public sealed record StreakResult(int CurrentDays, int LongestDays, DateOnly? LastWorkoutDate);
