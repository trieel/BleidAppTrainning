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

    [HttpGet("session/active")]
    public async Task<ActionResult<WorkoutSessionResult?>> Active(CancellationToken cancellationToken)
    {
        var session = await workoutService.GetActiveSessionAsync(CurrentUserId, cancellationToken);
        if (session is null)
            return NoContent();

        return Ok(session);
    }

    [HttpGet("session/{id:guid}")]
    public async Task<ActionResult<WorkoutSessionResult>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        return Ok(await workoutService.GetSessionByIdAsync(CurrentUserId, id, cancellationToken));
    }

    [HttpPost("session/{id:guid}/set")]
    public async Task<ActionResult<WorkoutSessionResult>> RegisterSet(
        Guid id,
        RegisterSetCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await workoutService.RegisterSetAsync(CurrentUserId, id, command, cancellationToken));
    }

    [HttpDelete("session/{id:guid}/set/{setId:guid}")]
    public async Task<ActionResult<WorkoutSessionResult>> DeleteSet(
        Guid id,
        Guid setId,
        CancellationToken cancellationToken)
    {
        return Ok(await workoutService.DeleteSetAsync(CurrentUserId, id, setId, cancellationToken));
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
