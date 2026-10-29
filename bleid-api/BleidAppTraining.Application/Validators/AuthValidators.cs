using BleidAppTraining.Application.Contracts;
using FluentValidation;

namespace BleidAppTraining.Application.Validators;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email must be a valid address.")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters.");

        RuleFor(command => command.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.");

        RuleFor(command => command.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(150).WithMessage("Full name cannot exceed 150 characters.");
    }
}

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email must be a valid address.");

        RuleFor(command => command.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(command => command.FullName)
            .MaximumLength(150).WithMessage("Full name cannot exceed 150 characters.")
            .When(command => !string.IsNullOrEmpty(command.FullName));

        RuleFor(command => command.Age)
            .InclusiveBetween(13, 100).WithMessage("Age must be between 13 and 100.")
            .When(command => command.Age.HasValue);

        RuleFor(command => command.DaysPerWeek)
            .InclusiveBetween(2, 6).WithMessage("Days per week must be between 2 and 6.")
            .When(command => command.DaysPerWeek.HasValue);

        RuleFor(command => command.SessionMin)
            .Must(val => val is 30 or 45 or 60).WithMessage("Session length must be 30, 45 or 60 minutes.")
            .When(command => command.SessionMin.HasValue);

        RuleFor(command => command.Goal)
            .IsInEnum().WithMessage("Invalid goal type.")
            .When(command => command.Goal.HasValue);

        RuleFor(command => command.Level)
            .IsInEnum().WithMessage("Invalid level type.")
            .When(command => command.Level.HasValue);

        RuleFor(command => command.Sex)
            .IsInEnum().WithMessage("Invalid sex type.")
            .When(command => command.Sex.HasValue);

        RuleForEach(command => command.Limitations)
            .SetValidator(new UserLimitationInputValidator())
            .When(command => command.Limitations is not null);
    }
}

public sealed class UserLimitationInputValidator : AbstractValidator<UserLimitationInput>
{
    public UserLimitationInputValidator()
    {
        RuleFor(item => item.Type).IsInEnum();
        RuleFor(item => item.Severity).IsInEnum();
    }
}
