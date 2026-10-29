using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface IProgressService
{
    Task<IReadOnlyCollection<VolumeProgressResult>> GetVolumeAsync(Guid userId, int? timezoneOffsetMinutes = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ExerciseProgressResult>> GetExerciseProgressAsync(Guid userId, Guid exerciseId, int? timezoneOffsetMinutes = null, CancellationToken cancellationToken = default);
    Task<StreakResult> GetStreakAsync(Guid userId, int? timezoneOffsetMinutes = null, CancellationToken cancellationToken = default);
    Task<ExerciseLatestPerformanceResult?> GetLatestPerformanceAsync(Guid userId, Guid exerciseId, Guid? excludeSessionId = null, int? timezoneOffsetMinutes = null, CancellationToken cancellationToken = default);
}
