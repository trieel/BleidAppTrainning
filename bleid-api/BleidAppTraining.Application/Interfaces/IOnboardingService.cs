using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface IOnboardingService
{
    Task<OnboardingResult> CompleteAsync(Guid userId, OnboardingCommand command, CancellationToken cancellationToken = default);
}
