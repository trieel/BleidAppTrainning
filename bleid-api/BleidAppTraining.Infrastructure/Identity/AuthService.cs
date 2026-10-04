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
            throw new ServiceValidationException("Invalid email or password.");

        var result = await signInManager.CheckPasswordSignInAsync(user, command.Password, lockoutOnFailure: true);
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
}
