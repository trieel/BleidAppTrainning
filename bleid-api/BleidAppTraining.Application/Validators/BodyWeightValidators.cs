using BleidAppTraining.Application.Contracts;
using FluentValidation;

namespace BleidAppTraining.Application.Validators;

public sealed class LogBodyWeightCommandValidator : AbstractValidator<LogBodyWeightCommand>
{
    public LogBodyWeightCommandValidator()
    {
        RuleFor(command => command.WeightKg)
            .GreaterThan(0m).WithMessage("El peso corporal debe ser mayor a 0 kg.")
            .LessThanOrEqualTo(500m).WithMessage("El peso corporal debe ser menor o igual a 500 kg.");

        RuleFor(command => command.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters.")
            .When(command => !string.IsNullOrEmpty(command.Notes));
    }
}
