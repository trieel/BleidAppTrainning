using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/workout")]
public class WorkoutController(IWorkoutService workoutService) : AuthenticatedControllerBase
{
    [HttpPost("session/start")]
    public async Task<ActionResult<WorkoutSessionResult>> Start(
        StartSessionCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await workoutService.StartSessionAsync(CurrentUserId, command, cancellationToken));
    }

    [HttpPost("session/{id:guid}/set")]
    public async Task<ActionResult<WorkoutSessionResult>> RegisterSet(
        Guid id,
        RegisterSetCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await workoutService.RegisterSetAsync(CurrentUserId, id, command, cancellationToken));
    }

    [HttpPut("session/{id:guid}/end")]
    public async Task<ActionResult<WorkoutSessionResult>> End(
        Guid id,
        EndSessionCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await workoutService.EndSessionAsync(CurrentUserId, id, command, cancellationToken));
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyCollection<WorkoutSessionResult>>> History(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return Ok(await workoutService.GetHistoryAsync(CurrentUserId, page, pageSize, cancellationToken));
    }
}
