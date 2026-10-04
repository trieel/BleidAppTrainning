using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface IProgressService
{
    Task<IReadOnlyCollection<VolumeProgressResult>> GetVolumeAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ExerciseProgressResult>> GetExerciseProgressAsync(Guid userId, Guid exerciseId, CancellationToken cancellationToken = default);
    Task<StreakResult> GetStreakAsync(Guid userId, CancellationToken cancellationToken = default);
}
