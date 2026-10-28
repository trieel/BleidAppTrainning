using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface IBodyWeightService
{
    Task<BodyWeightResult> LogAsync(Guid userId, LogBodyWeightCommand command, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<BodyWeightResult>> GetHistoryAsync(Guid userId, int days = 90, CancellationToken cancellationToken = default);
    Task<BodyWeightResult?> GetLatestAsync(Guid userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
}
