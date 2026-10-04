using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/exercises")]
public class ExerciseController(IExerciseService exerciseService) : AuthenticatedControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<ExerciseResult>>> GetAll(
        [FromQuery] Guid? muscleGroupId,
        CancellationToken cancellationToken)
    {
        return Ok(await exerciseService.GetCatalogAsync(CurrentUserId, muscleGroupId, cancellationToken));
    }

    [HttpGet("muscle-group/{id:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<ExerciseResult>>> GetByMuscleGroup(
        Guid id,
        CancellationToken cancellationToken)
    {
        return Ok(await exerciseService.GetByMuscleGroupAsync(CurrentUserId, id, cancellationToken));
    }
}
