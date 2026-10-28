using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("AuthPolicy")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResult>> Register(
        RegisterCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await authService.RegisterAsync(command, cancellationToken));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResult>> Login(
        LoginCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await authService.LoginAsync(command, cancellationToken));
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
