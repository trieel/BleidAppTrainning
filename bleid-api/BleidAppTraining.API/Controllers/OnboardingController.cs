using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/onboarding")]
public class OnboardingController(IOnboardingService onboardingService) : AuthenticatedControllerBase
{
    [HttpPost]
    public async Task<ActionResult<OnboardingResult>> Complete(
        OnboardingCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await onboardingService.CompleteAsync(CurrentUserId, command, cancellationToken));
    }
}
