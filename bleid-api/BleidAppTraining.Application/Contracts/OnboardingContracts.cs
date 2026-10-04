using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Application.Contracts;

public sealed class OnboardingCommand
{
    public GoalType Goal { get; set; }
    public LevelType Level { get; set; }
    public int DaysPerWeek { get; set; }
    public int SessionMin { get; set; }
    public int Age { get; set; }
    public SexType Sex { get; set; }
    public List<LimitationInput> Limitations { get; set; } = new();
}

public sealed class LimitationInput
{
    public LimitationType Type { get; set; }
    public SeverityType Severity { get; set; }
}

public sealed record OnboardingResult(UserProfileResult User, RoutineResult Routine);
