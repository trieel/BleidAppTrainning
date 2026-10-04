using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Services;

public class RoutineService(IApplicationDbContext db) : IRoutineService
{
    public async Task<RoutineResult> GetActiveAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var routine = await db.UserRoutines
            .AsNoTracking()
            .Where(userRoutine => userRoutine.UserId == userId && userRoutine.IsActive)
            .Select(userRoutine => userRoutine.Routine)
            .Include(routine => routine.Days)
            .ThenInclude(day => day.Exercises)
            .ThenInclude(exercise => exercise.Exercise)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("The user does not have an active routine.");

        return ResultMappings.Routine(routine);
    }

    public async Task<RoutineResult> AssignForProfileAsync(
        Guid userId,
        GoalType goal,
        LevelType level,
        int daysPerWeek,
        CancellationToken cancellationToken = default)
    {
        var template = await db.Routines
            .AsNoTracking()
            .Where(routine => routine.IsTemplate &&
                              routine.Goal == goal &&
                              routine.Level == level &&
                              routine.DaysPerWeek == daysPerWeek)
            .Include(routine => routine.Days)
            .ThenInclude(day => day.Exercises)
            .ThenInclude(exercise => exercise.Exercise)
            .OrderBy(routine => routine.Name)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new ServiceValidationException("No routine template matches the selected profile.");

        return await CloneAndActivateAsync(userId, template, cancellationToken);
    }

    public async Task<RoutineResult> CustomizeAsync(
        Guid userId,
        CustomizeRoutineCommand command,
        CancellationToken cancellationToken = default)
    {
        var template = await db.Routines
            .AsNoTracking()
            .Where(routine => routine.Id == command.TemplateId && routine.IsTemplate)
            .Include(routine => routine.Days)
            .ThenInclude(day => day.Exercises)
            .ThenInclude(exercise => exercise.Exercise)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("The requested routine template was not found.");

        return await CloneAndActivateAsync(userId, template, cancellationToken);
    }

    public async Task<RoutineResult> UpdateDayAsync(
        Guid userId,
        Guid routineId,
        Guid dayId,
        UpdateRoutineDayCommand command,
        CancellationToken cancellationToken = default)
    {
        var day = await GetOwnedDayAsync(userId, routineId, dayId, cancellationToken);
        if (command.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(command.Name))
                throw new ServiceValidationException("Day name cannot be empty.");

            day.Name = command.Name.Trim();
        }

        if (command.Order.HasValue)
        {
            if (command.Order.Value < 1)
                throw new ServiceValidationException("Day order must be greater than zero.");

            day.Order = command.Order.Value;
        }

        await db.SaveChangesAsync(cancellationToken);
        return await GetOwnedRoutineAsync(userId, routineId, cancellationToken);
    }

    public async Task<RoutineResult> AddExerciseAsync(
        Guid userId,
        Guid routineId,
        Guid dayId,
        AddRoutineExerciseCommand command,
        CancellationToken cancellationToken = default)
    {
        var day = await GetOwnedDayAsync(userId, routineId, dayId, cancellationToken);
        var exercise = await db.Exercises.SingleOrDefaultAsync(item => item.Id == command.ExerciseId, cancellationToken)
            ?? throw new KeyNotFoundException("The requested exercise was not found.");

        var limitations = await db.UserLimitations
            .Where(limitation => limitation.UserId == userId)
            .Select(limitation => limitation.Type)
            .ToListAsync(cancellationToken);
        if (ExerciseService.IsContraindicated(exercise.Contraindications, limitations))
            throw new ServiceValidationException("This exercise is contraindicated for the user's limitations.");

        if (command.Sets < 1 || command.RepsMin < 1 || command.RepsMax < command.RepsMin || command.RestSeconds < 0)
            throw new ServiceValidationException("Exercise configuration is invalid.");

        var order = await db.RoutineExercises
            .Where(item => item.RoutineDayId == day.Id)
            .Select(item => (int?)item.Order)
            .MaxAsync(cancellationToken) ?? 0;

        db.RoutineExercises.Add(new RoutineExercise
        {
            RoutineDayId = day.Id,
            ExerciseId = exercise.Id,
            Sets = command.Sets,
            RepsMin = command.RepsMin,
            RepsMax = command.RepsMax,
            RestSeconds = command.RestSeconds,
            Order = order + 1
        });

        await db.SaveChangesAsync(cancellationToken);
        return await GetOwnedRoutineAsync(userId, routineId, cancellationToken);
    }

    public async Task<RoutineResult> RemoveExerciseAsync(
        Guid userId,
        Guid routineId,
        Guid dayId,
        Guid exerciseId,
        CancellationToken cancellationToken = default)
    {
        _ = await GetOwnedDayAsync(userId, routineId, dayId, cancellationToken);
        var routineExercise = await db.RoutineExercises
            .SingleOrDefaultAsync(item => item.RoutineDayId == dayId &&
                                          (item.Id == exerciseId || item.ExerciseId == exerciseId), cancellationToken)
            ?? throw new KeyNotFoundException("The requested routine exercise was not found.");

        db.RoutineExercises.Remove(routineExercise);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOwnedRoutineAsync(userId, routineId, cancellationToken);
    }

    private async Task<RoutineResult> CloneAndActivateAsync(
        Guid userId,
        Routine template,
        CancellationToken cancellationToken)
    {
        var limitations = await db.UserLimitations
            .Where(limitation => limitation.UserId == userId)
            .Select(limitation => limitation.Type)
            .ToListAsync(cancellationToken);

        var clone = new Routine
        {
            CreatedBy = userId,
            Name = template.Name,
            Goal = template.Goal,
            Level = template.Level,
            DaysPerWeek = template.DaysPerWeek,
            IsTemplate = false
        };

        foreach (var templateDay in template.Days.OrderBy(day => day.Order))
        {
            var day = new RoutineDay
            {
                Routine = clone,
                DayNumber = templateDay.DayNumber,
                Name = templateDay.Name,
                Order = templateDay.Order
            };

            foreach (var templateExercise in templateDay.Exercises.OrderBy(item => item.Order))
            {
                var exercise = templateExercise.Exercise;
                if (ExerciseService.IsContraindicated(exercise.Contraindications, limitations))
                {
                    exercise = await FindAlternativeAsync(exercise, limitations, cancellationToken)
                        ?? throw new ServiceValidationException(
                            $"No safe alternative was found for '{exercise.Name}'.");
                }

                day.Exercises.Add(new RoutineExercise
                {
                    RoutineDay = day,
                    ExerciseId = exercise.Id,
                    Sets = templateExercise.Sets,
                    RepsMin = templateExercise.RepsMin,
                    RepsMax = templateExercise.RepsMax,
                    RestSeconds = templateExercise.RestSeconds,
                    Order = templateExercise.Order
                });
            }

            clone.Days.Add(day);
        }

        var activeRoutines = await db.UserRoutines
            .Where(userRoutine => userRoutine.UserId == userId && userRoutine.IsActive)
            .ToListAsync(cancellationToken);
        foreach (var activeRoutine in activeRoutines)
            activeRoutine.IsActive = false;

        db.Routines.Add(clone);
        db.UserRoutines.Add(new UserRoutine
        {
            UserId = userId,
            Routine = clone,
            IsActive = true
        });

        await db.SaveChangesAsync(cancellationToken);
        return await GetOwnedRoutineAsync(userId, clone.Id, cancellationToken);
    }

    private async Task<Exercise?> FindAlternativeAsync(
        Exercise source,
        IReadOnlyCollection<LimitationType> limitations,
        CancellationToken cancellationToken)
    {
        var candidates = await db.Exercises
            .AsNoTracking()
            .Where(exercise => exercise.MuscleGroupId == source.MuscleGroupId && exercise.Id != source.Id)
            .OrderBy(exercise => exercise.Name)
            .ToListAsync(cancellationToken);

        return candidates.FirstOrDefault(exercise =>
            !ExerciseService.IsContraindicated(exercise.Contraindications, limitations));
    }

    private async Task<RoutineDay> GetOwnedDayAsync(
        Guid userId,
        Guid routineId,
        Guid dayId,
        CancellationToken cancellationToken)
    {
        var isOwned = await db.UserRoutines.AnyAsync(userRoutine =>
            userRoutine.UserId == userId && userRoutine.RoutineId == routineId, cancellationToken);
        if (!isOwned)
            throw new KeyNotFoundException("The requested routine was not found for this user.");

        return await db.RoutineDays.SingleOrDefaultAsync(day => day.Id == dayId && day.RoutineId == routineId, cancellationToken)
            ?? throw new KeyNotFoundException("The requested routine day was not found.");
    }

    private async Task<RoutineResult> GetOwnedRoutineAsync(
        Guid userId,
        Guid routineId,
        CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .AsNoTracking()
            .Where(item => item.Id == routineId &&
                           db.UserRoutines.Any(userRoutine => userRoutine.UserId == userId && userRoutine.RoutineId == routineId))
            .Include(item => item.Days)
            .ThenInclude(day => day.Exercises)
            .ThenInclude(exercise => exercise.Exercise)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("The requested routine was not found for this user.");

        return ResultMappings.Routine(routine);
    }
}
