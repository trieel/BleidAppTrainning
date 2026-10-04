using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[Authorize]
public abstract class AuthenticatedControllerBase : ControllerBase
{
    protected Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue("userId") ??
        throw new UnauthorizedAccessException("The access token does not contain a user id."));
}
