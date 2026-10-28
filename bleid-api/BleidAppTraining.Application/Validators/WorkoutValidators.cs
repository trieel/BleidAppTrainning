using BleidAppTraining.Application.Contracts;
using FluentValidation;

namespace BleidAppTraining.Application.Validators;

public sealed class StartSessionCommandValidator : AbstractValidator<StartSessionCommand>
{
    public StartSessionCommandValidator()
    {
        RuleFor(command => command.RoutineDayId)
            .NotEmpty().WithMessage("Routine day id is required.");
    }
}

public sealed class RegisterSetCommandValidator : AbstractValidator<RegisterSetCommand>
{
    public RegisterSetCommandValidator()
    {
        RuleFor(command => command.ExerciseId)
            .NotEmpty().WithMessage("Exercise id is required.");

        RuleFor(command => command.SetNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Set number must be at least 1.");

        RuleFor(command => command.Reps)
            .InclusiveBetween(1, 200).WithMessage("Reps must be between 1 and 200.");

        RuleFor(command => command.WeightKg)
            .InclusiveBetween(0m, 1000m).WithMessage("Weight must be between 0 and 1000 kg.");
    }
}

public sealed class EndSessionCommandValidator : AbstractValidator<EndSessionCommand>
{
    public EndSessionCommandValidator()
    {
        RuleFor(command => command.Notes)
            .MaximumLength(2000).WithMessage("Notes cannot exceed 2000 characters.");
    }
}
