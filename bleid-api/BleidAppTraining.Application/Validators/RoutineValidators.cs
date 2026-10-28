using BleidAppTraining.Application.Contracts;
using FluentValidation;

namespace BleidAppTraining.Application.Validators;

public sealed class CustomizeRoutineCommandValidator : AbstractValidator<CustomizeRoutineCommand>
{
    public CustomizeRoutineCommandValidator()
    {
        RuleFor(command => command.TemplateId)
            .NotEmpty().WithMessage("Template id is required.");
    }
}

public sealed class UpdateRoutineDayCommandValidator : AbstractValidator<UpdateRoutineDayCommand>
{
    public UpdateRoutineDayCommandValidator()
    {
        RuleFor(command => command.Name)
            .MaximumLength(100).WithMessage("Day name cannot exceed 100 characters.")
            .When(command => command.Name is not null);

        RuleFor(command => command.Order)
            .GreaterThanOrEqualTo(1).WithMessage("Day order must be at least 1.")
            .When(command => command.Order.HasValue);
    }
}

public sealed class AddRoutineExerciseCommandValidator : AbstractValidator<AddRoutineExerciseCommand>
{
    public AddRoutineExerciseCommandValidator()
    {
        RuleFor(command => command.ExerciseId)
            .NotEmpty().WithMessage("Exercise id is required.");

        RuleFor(command => command.Sets)
            .InclusiveBetween(1, 20).WithMessage("Sets must be between 1 and 20.");

        RuleFor(command => command.RepsMin)
            .InclusiveBetween(1, 200).WithMessage("Minimum reps must be between 1 and 200.");

        RuleFor(command => command.RepsMax)
            .GreaterThanOrEqualTo(command => command.RepsMin)
            .WithMessage("Maximum reps must be greater than or equal to minimum reps.");

        RuleFor(command => command.RestSeconds)
            .InclusiveBetween(0, 600).WithMessage("Rest must be between 0 and 600 seconds.");
    }
}
