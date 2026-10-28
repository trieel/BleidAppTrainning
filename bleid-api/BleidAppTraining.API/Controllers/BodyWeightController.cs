using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/progress/bodyweight")]
public class BodyWeightController(IBodyWeightService bodyWeightService) : AuthenticatedControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<BodyWeightResult>>> GetHistory(
        [FromQuery] int days = 90,
        CancellationToken cancellationToken = default)
    {
        var history = await bodyWeightService.GetHistoryAsync(CurrentUserId, days, cancellationToken);
        return Ok(history);
    }

    [HttpGet("latest")]
    public async Task<ActionResult<BodyWeightResult?>> GetLatest(CancellationToken cancellationToken = default)
    {
        var latest = await bodyWeightService.GetLatestAsync(CurrentUserId, cancellationToken);
        return Ok(latest);
    }

    [HttpPost]
    public async Task<ActionResult<BodyWeightResult>> Log(
        [FromBody] LogBodyWeightCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await bodyWeightService.LogAsync(CurrentUserId, command, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        await bodyWeightService.DeleteAsync(CurrentUserId, id, cancellationToken);
        return NoContent();
    }
}
