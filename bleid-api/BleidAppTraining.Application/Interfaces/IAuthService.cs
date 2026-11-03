using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterCommand command, CancellationToken cancellationToken = default);
    Task<AuthResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken = default);
    Task<AuthResult> RefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AuthResult> RefreshTokenWithGracePeriodAsync(string token, CancellationToken cancellationToken = default);
    Task<UserProfileResult> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserProfileResult> UpdateProfileAsync(Guid userId, UpdateProfileCommand command, CancellationToken cancellationToken = default);
}
