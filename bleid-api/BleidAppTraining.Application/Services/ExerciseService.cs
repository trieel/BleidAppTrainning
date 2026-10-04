using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Services;

public class ExerciseService(IApplicationDbContext db) : IExerciseService
{
    public async Task<IReadOnlyCollection<ExerciseResult>> GetCatalogAsync(
        Guid userId,
        Guid? muscleGroupId,
        CancellationToken cancellationToken = default)
    {
        var limitations = await GetLimitationsAsync(userId, cancellationToken);
        var query = db.Exercises
            .AsNoTracking()
            .Include(exercise => exercise.MuscleGroup)
            .AsQueryable();

        if (muscleGroupId.HasValue)
            query = query.Where(exercise => exercise.MuscleGroupId == muscleGroupId.Value);

        var exercises = await query.OrderBy(exercise => exercise.Name).ToListAsync(cancellationToken);

        return exercises
            .Where(exercise => !IsContraindicated(exercise.Contraindications, limitations))
            .Select(exercise => new ExerciseResult(
                exercise.Id,
                exercise.MuscleGroupId,
                exercise.MuscleGroup.Name,
                exercise.Name,
                exercise.Description,
                exercise.Equipment,
                exercise.Level,
                exercise.Contraindications,
                exercise.ModificationTip,
                exercise.ImageUrl,
                false))
            .ToArray();
    }

    public Task<IReadOnlyCollection<ExerciseResult>> GetByMuscleGroupAsync(
        Guid userId,
        Guid muscleGroupId,
        CancellationToken cancellationToken = default) =>
        GetCatalogAsync(userId, muscleGroupId, cancellationToken);

    public async Task<IReadOnlyCollection<MuscleGroupResult>> GetMuscleGroupsAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.MuscleGroups
            .AsNoTracking()
            .OrderBy(group => group.Name)
            .Select(group => new MuscleGroupResult(group.Id, group.Name, group.Icon))
            .ToArrayAsync(cancellationToken);
    }

    private async Task<HashSet<LimitationType>> GetLimitationsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var types = await db.UserLimitations
            .AsNoTracking()
            .Where(limitation => limitation.UserId == userId)
            .Select(limitation => limitation.Type)
            .ToListAsync(cancellationToken);

        return types.ToHashSet();
    }

    internal static bool IsContraindicated(IEnumerable<string> contraindications, IEnumerable<LimitationType> limitations)
    {
        var normalizedContraindications = contraindications
            .Select(Normalize)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return limitations.Any(limitation => normalizedContraindications.Contains(Normalize(limitation.ToString())));
    }

    private static string Normalize(string value) => value.Replace("_", string.Empty).Replace(" ", string.Empty);
}
