using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Application.Contracts;

public sealed class RegisterCommand
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public sealed class LoginCommand
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed record AuthResult(string Token, UserProfileResult User);

public sealed record UserProfileResult(
    Guid Id,
    string Email,
    string FullName,
    string? AvatarUrl,
    int? Age,
    SexType? Sex,
    GoalType? Goal,
    LevelType? Level,
    int? DaysPerWeek,
    int? SessionMin,
    IReadOnlyCollection<UserLimitationResult> Limitations);

public sealed record UserLimitationResult(LimitationType Type, SeverityType Severity);
