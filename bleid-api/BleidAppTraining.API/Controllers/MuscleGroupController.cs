using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BleidAppTraining.API.Controllers;

[ApiController]
[Route("api/muscle-groups")]
public class MuscleGroupController(IExerciseService exerciseService) : AuthenticatedControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<MuscleGroupResult>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await exerciseService.GetMuscleGroupsAsync(cancellationToken));
    }
}
