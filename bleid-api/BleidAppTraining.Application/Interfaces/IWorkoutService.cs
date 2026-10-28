using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface IWorkoutService
{
    Task<WorkoutSessionResult> StartSessionAsync(Guid userId, StartSessionCommand command, CancellationToken cancellationToken = default);
    Task<WorkoutSessionResult?> GetActiveSessionAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<WorkoutSessionResult> GetSessionByIdAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<WorkoutSessionResult> RegisterSetAsync(Guid userId, Guid sessionId, RegisterSetCommand command, CancellationToken cancellationToken = default);
    Task<WorkoutSessionResult> DeleteSetAsync(Guid userId, Guid sessionId, Guid setId, CancellationToken cancellationToken = default);
    Task<WorkoutSessionResult> EndSessionAsync(Guid userId, Guid sessionId, EndSessionCommand command, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<WorkoutSessionResult>> GetHistoryAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
}
