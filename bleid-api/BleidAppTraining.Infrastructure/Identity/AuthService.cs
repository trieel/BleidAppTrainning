using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Infrastructure.Identity;

public class AuthService(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    IJwtTokenService tokenService,
    IApplicationDbContext db) : IAuthService
{
    private static readonly string DummyPasswordHash = new PasswordHasher<User>()
        .HashPassword(new User(), "BleidAppDummyPassword123!");

    public async Task<AuthResult> RegisterAsync(
        RegisterCommand command,
        CancellationToken cancellationToken = default)
    {
        var email = command.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(command.FullName))
            throw new ServiceValidationException("Email and full name are required.");

        if (await userManager.FindByEmailAsync(email) is not null)
            throw new ServiceValidationException("An account with this email already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = command.FullName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, command.Password);
        if (!result.Succeeded)
            throw new ServiceValidationException(result.Errors.Select(error => error.Description).ToArray());

        var roleResult = await userManager.AddToRoleAsync(user, RoleNames.User);
        if (!roleResult.Succeeded)
            throw new InvalidOperationException("The user was created but its default role could not be assigned.");

        var roles = await userManager.GetRolesAsync(user);
        return new AuthResult(tokenService.CreateToken(user, roles), ResultMappings.User(user));
    }

    public async Task<AuthResult> LoginAsync(
        LoginCommand command,
        CancellationToken cancellationToken = default)
    {
        var email = command.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            userManager.PasswordHasher.VerifyHashedPassword(new User(), DummyPasswordHash, command.Password);
            throw new ServiceValidationException("Invalid email or password.");
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, command.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            throw new ServiceValidationException("Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 15 minutos por seguridad.");
        }

        if (!result.Succeeded)
            throw new ServiceValidationException("Invalid email or password.");

        var roles = await userManager.GetRolesAsync(user);
        var profile = await GetProfileAsync(user.Id, cancellationToken);
        return new AuthResult(tokenService.CreateToken(user, roles), profile);
    }

    public async Task<UserProfileResult> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await db.Users
            .AsNoTracking()
            .Include(item => item.Limitations)
            .SingleOrDefaultAsync(item => item.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("The authenticated user was not found.");

        return ResultMappings.User(user);
    }

    public async Task<UserProfileResult> UpdateProfileAsync(
        Guid userId,
        UpdateProfileCommand command,
        CancellationToken cancellationToken = default)
    {
        var user = await db.Users
            .Include(item => item.Limitations)
            .SingleOrDefaultAsync(item => item.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("The authenticated user was not found.");

        if (!string.IsNullOrWhiteSpace(command.FullName))
            user.FullName = command.FullName.Trim();

        if (command.Age.HasValue)
            user.Age = command.Age.Value;

        if (command.Sex.HasValue)
            user.Sex = command.Sex.Value;

        if (command.Goal.HasValue)
            user.Goal = command.Goal.Value;

        if (command.Level.HasValue)
            user.Level = command.Level.Value;

        if (command.DaysPerWeek.HasValue)
            user.DaysPerWeek = Math.Clamp(command.DaysPerWeek.Value, 2, 6);

        if (command.SessionMin.HasValue)
            user.SessionMin = Math.Clamp(command.SessionMin.Value, 20, 180);

        if (command.Limitations is not null)
        {
            db.UserLimitations.RemoveRange(user.Limitations);
            user.Limitations.Clear();

            foreach (var input in command.Limitations)
            {
                var limitation = new UserLimitation
                {
                    UserId = userId,
                    Type = input.Type,
                    Severity = input.Severity
                };
                user.Limitations.Add(limitation);
                db.UserLimitations.Add(limitation);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return ResultMappings.User(user);
    }
}
