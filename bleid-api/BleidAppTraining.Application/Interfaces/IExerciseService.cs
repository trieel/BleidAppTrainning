using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface IExerciseService
{
    Task<IReadOnlyCollection<ExerciseResult>> GetCatalogAsync(Guid userId, Guid? muscleGroupId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ExerciseResult>> GetByMuscleGroupAsync(Guid userId, Guid muscleGroupId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<MuscleGroupResult>> GetMuscleGroupsAsync(CancellationToken cancellationToken = default);
}
