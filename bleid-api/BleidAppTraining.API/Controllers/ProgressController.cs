using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/progress")]
public class ProgressController(IProgressService progressService) : AuthenticatedControllerBase
{
    [HttpGet("volume")]
    public async Task<ActionResult<IReadOnlyCollection<VolumeProgressResult>>> Volume(CancellationToken cancellationToken)
    {
        return Ok(await progressService.GetVolumeAsync(CurrentUserId, ClientTimezoneOffset, cancellationToken));
    }

    [HttpGet("exercise/{id:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<ExerciseProgressResult>>> Exercise(
        Guid id,
        CancellationToken cancellationToken)
    {
        return Ok(await progressService.GetExerciseProgressAsync(CurrentUserId, id, ClientTimezoneOffset, cancellationToken));
    }

    [HttpGet("exercise/{id:guid}/latest")]
    public async Task<ActionResult<ExerciseLatestPerformanceResult?>> LatestExercisePerformance(
        Guid id,
        [FromQuery] Guid? excludeSessionId,
        CancellationToken cancellationToken)
    {
        var result = await progressService.GetLatestPerformanceAsync(CurrentUserId, id, excludeSessionId, ClientTimezoneOffset, cancellationToken);
        return Ok(result);
    }

    [HttpGet("streak")]
    public async Task<ActionResult<StreakResult>> Streak(CancellationToken cancellationToken)
    {
        return Ok(await progressService.GetStreakAsync(CurrentUserId, ClientTimezoneOffset, cancellationToken));
    }
}
