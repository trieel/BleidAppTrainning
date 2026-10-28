using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/routines")]
public class RoutineController(IRoutineService routineService) : AuthenticatedControllerBase
{
    [HttpGet("my")]
    public async Task<ActionResult<RoutineResult>> GetMy(CancellationToken cancellationToken)
    {
        return Ok(await routineService.GetActiveAsync(CurrentUserId, cancellationToken));
    }

    [HttpPost("customize")]
    public async Task<ActionResult<RoutineResult>> Customize(
        CustomizeRoutineCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await routineService.CustomizeAsync(CurrentUserId, command, cancellationToken));
    }

    [HttpPost("{id:guid}/days")]
    public async Task<ActionResult<RoutineResult>> AddDay(
        Guid id,
        AddRoutineDayCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await routineService.AddDayAsync(CurrentUserId, id, command, cancellationToken));
    }

    [HttpDelete("{id:guid}/days/{dayId:guid}")]
    public async Task<ActionResult<RoutineResult>> DeleteDay(
        Guid id,
        Guid dayId,
        CancellationToken cancellationToken)
    {
        return Ok(await routineService.DeleteDayAsync(CurrentUserId, id, dayId, cancellationToken));
    }

    [HttpPut("{id:guid}/day/{dayId:guid}")]
    public async Task<ActionResult<RoutineResult>> UpdateDay(
        Guid id,
        Guid dayId,
        UpdateRoutineDayCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await routineService.UpdateDayAsync(CurrentUserId, id, dayId, command, cancellationToken));
    }

    [HttpPost("{id:guid}/day/{dayId:guid}/exercises")]
    public async Task<ActionResult<RoutineResult>> AddExercise(
        Guid id,
        Guid dayId,
        AddRoutineExerciseCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await routineService.AddExerciseAsync(CurrentUserId, id, dayId, command, cancellationToken));
    }

    [HttpDelete("{id:guid}/day/{dayId:guid}/exercises/{exerciseId:guid}")]
    public async Task<ActionResult<RoutineResult>> RemoveExercise(
        Guid id,
        Guid dayId,
        Guid exerciseId,
        CancellationToken cancellationToken)
    {
        return Ok(await routineService.RemoveExerciseAsync(CurrentUserId, id, dayId, exerciseId, cancellationToken));
    }
}
