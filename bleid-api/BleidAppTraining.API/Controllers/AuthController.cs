using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResult>> Register(
        RegisterCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await authService.RegisterAsync(command, cancellationToken));
    }

    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResult>> Login(
        LoginCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await authService.LoginAsync(command, cancellationToken));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResult>> Refresh(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
        {
            return Ok(await authService.RefreshTokenAsync(userId, cancellationToken));
        }

        var authHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized("Authorization header with Bearer token is required.");
        }

        var token = authHeader["Bearer ".Length..].Trim();
        try
        {
            return Ok(await authService.RefreshTokenWithGracePeriodAsync(token, cancellationToken));
        }
        catch (ServiceValidationException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return Unauthorized("User account was not found.");
        }
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserProfileResult>> Me(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        return Ok(await authService.GetProfileAsync(userId, cancellationToken));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileResult>> UpdateProfile(
        UpdateProfileCommand command,
        CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        return Ok(await authService.UpdateProfileAsync(userId, command, cancellationToken));
    }
}
