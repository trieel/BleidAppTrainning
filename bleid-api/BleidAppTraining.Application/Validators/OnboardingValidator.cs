using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Domain.Enums;
using FluentValidation;

namespace BleidAppTraining.Application.Validators;

public sealed class OnboardingCommandValidator : AbstractValidator<OnboardingCommand>
{
    public OnboardingCommandValidator()
    {
        RuleFor(command => command.Goal).IsInEnum();
        RuleFor(command => command.Level).IsInEnum();
        RuleFor(command => command.Sex).IsInEnum();

        RuleFor(command => command.DaysPerWeek)
            .InclusiveBetween(2, 6).WithMessage("Days per week must be between 2 and 6.");

        RuleFor(command => command.SessionMin)
            .Must(value => value is 30 or 45 or 60)
            .WithMessage("Session length must be 30, 45 or 60 minutes.");

        RuleFor(command => command.Age)
            .InclusiveBetween(13, 100).WithMessage("Age must be between 13 and 100.");

        RuleForEach(command => command.Limitations).SetValidator(new LimitationInputValidator());
    }
}

public sealed class LimitationInputValidator : AbstractValidator<LimitationInput>
{
    public LimitationInputValidator()
    {
        RuleFor(item => item.Type).IsInEnum();
        RuleFor(item => item.Severity).IsInEnum();
    }
}
