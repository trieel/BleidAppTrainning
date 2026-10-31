using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/subscriptions")]
public class SubscriptionsController(ISubscriptionService subscriptionService) : AuthenticatedControllerBase
{
    [HttpPost("checkout")]
    public async Task<ActionResult<SubscriptionCheckoutResult>> Checkout(CancellationToken cancellationToken)
    {
        return Ok(await subscriptionService.CreateCheckoutSessionAsync(CurrentUserId, cancellationToken));
    }

    [HttpPost("verify")]
    public async Task<ActionResult<SubscriptionStatusResult>> Verify(
        [FromBody] VerifySubscriptionCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await subscriptionService.VerifySessionAsync(CurrentUserId, command.PreapprovalId, cancellationToken));
    }

    [HttpGet("my")]
    public async Task<ActionResult<SubscriptionStatusResult>> GetMyStatus(CancellationToken cancellationToken)
    {
        return Ok(await subscriptionService.GetStatusAsync(CurrentUserId, cancellationToken));
    }

    [HttpPost("cancel")]
    public async Task<ActionResult> Cancel(CancellationToken cancellationToken)
    {
        var success = await subscriptionService.CancelAsync(CurrentUserId, cancellationToken);
        return Ok(new { success });
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook(
        [FromBody] MercadoPagoWebhookDto dto,
        [FromHeader(Name = "x-signature")] string? xSignature,
        CancellationToken cancellationToken)
    {
        await subscriptionService.HandleWebhookAsync(dto, xSignature, cancellationToken);
        return Ok();
    }
}
