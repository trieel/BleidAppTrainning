using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Services;

public class WorkoutService(IApplicationDbContext db) : IWorkoutService
{
    public async Task<WorkoutSessionResult> StartSessionAsync(
        Guid userId,
        StartSessionCommand command,
        CancellationToken cancellationToken = default)
    {
        var day = await db.RoutineDays
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == command.RoutineDayId, cancellationToken)
            ?? throw new KeyNotFoundException("The requested routine day was not found.");

        var isActiveDay = await db.UserRoutines.AnyAsync(userRoutine =>
            userRoutine.UserId == userId &&
            userRoutine.IsActive &&
            userRoutine.RoutineId == day.RoutineId, cancellationToken);
        if (!isActiveDay)
            throw new KeyNotFoundException("The requested routine day is not part of the active routine.");

        var session = new WorkoutSession
        {
            UserId = userId,
            RoutineDayId = day.Id
        };

        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);
        return await GetSessionAsync(userId, session.Id, cancellationToken);
    }

    public async Task<WorkoutSessionResult> RegisterSetAsync(
        Guid userId,
        Guid sessionId,
        RegisterSetCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.SetNumber < 1 || command.Reps < 1 || command.WeightKg < 0)
            throw new ServiceValidationException("Set values are invalid.");

        var session = await db.WorkoutSessions
            .Include(item => item.RoutineDay)
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("The requested workout session was not found.");
        if (session.FinishedAt.HasValue)
            throw new ServiceValidationException("The workout session is already finished.");

        var exerciseExists = await db.RoutineExercises.AnyAsync(item =>
            item.RoutineDayId == session.RoutineDayId && item.ExerciseId == command.ExerciseId, cancellationToken);
        if (!exerciseExists)
            throw new ServiceValidationException("The exercise is not part of this routine day.");

        var duplicateSet = await db.WorkoutSets.AnyAsync(item =>
            item.SessionId == sessionId &&
            item.ExerciseId == command.ExerciseId &&
            item.SetNumber == command.SetNumber, cancellationToken);
        if (duplicateSet)
            throw new ServiceValidationException("That set number is already registered for this exercise.");

        db.WorkoutSets.Add(new WorkoutSet
        {
            SessionId = sessionId,
            ExerciseId = command.ExerciseId,
            SetNumber = command.SetNumber,
            Reps = command.Reps,
            WeightKg = command.WeightKg,
            Completed = command.Completed
        });

        await db.SaveChangesAsync(cancellationToken);
        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionResult> EndSessionAsync(
        Guid userId,
        Guid sessionId,
        EndSessionCommand command,
        CancellationToken cancellationToken = default)
    {
        var session = await db.WorkoutSessions
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("The requested workout session was not found.");
        if (session.FinishedAt.HasValue)
            throw new ServiceValidationException("The workout session is already finished.");

        session.FinishedAt = DateTime.UtcNow;
        session.Notes = string.IsNullOrWhiteSpace(command.Notes) ? null : command.Notes.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<WorkoutSessionResult>> GetHistoryAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(session => session.UserId == userId)
            .Include(session => session.RoutineDay)
            .Include(session => session.Sets)
            .ThenInclude(set => set.Exercise)
            .OrderByDescending(session => session.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return sessions.Select(ResultMappings.Session).ToArray();
    }

    private async Task<WorkoutSessionResult> GetSessionAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .AsNoTracking()
            .Where(item => item.Id == sessionId && item.UserId == userId)
            .Include(item => item.RoutineDay)
            .Include(item => item.Sets)
            .ThenInclude(set => set.Exercise)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("The workout session was not found.");

        return ResultMappings.Session(session);
    }
}
