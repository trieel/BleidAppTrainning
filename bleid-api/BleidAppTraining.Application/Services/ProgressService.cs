using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Services;

public class ProgressService(IApplicationDbContext db) : IProgressService
{
    private static readonly TimeSpan LocalTimeZoneOffset = TimeSpan.FromHours(-3);

    public async Task<IReadOnlyCollection<VolumeProgressResult>> GetVolumeAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-120);
        var sets = await db.WorkoutSets
            .AsNoTracking()
            .Where(set => set.Completed && set.Session.UserId == userId && set.Session.StartedAt >= cutoff)
            .Select(set => new { Date = set.Session.StartedAt, Volume = set.WeightKg * set.Reps })
            .ToListAsync(cancellationToken);

        return sets
            .GroupBy(item => GetWeekStart(item.Date.Add(LocalTimeZoneOffset)))
            .OrderBy(group => group.Key)
            .Select(group => new VolumeProgressResult(
                DateOnly.FromDateTime(group.Key),
                group.Sum(item => item.Volume)))
            .ToArray();
    }

    public async Task<IReadOnlyCollection<ExerciseProgressResult>> GetExerciseProgressAsync(
        Guid userId,
        Guid exerciseId,
        CancellationToken cancellationToken = default)
    {
        var sets = await db.WorkoutSets
            .AsNoTracking()
            .Where(set => set.ExerciseId == exerciseId &&
                          set.Completed &&
                          set.Session.UserId == userId)
            .Select(set => new { Date = set.Session.StartedAt, set.WeightKg, set.Reps })
            .ToListAsync(cancellationToken);

        return sets
            .GroupBy(item => item.Date.Add(LocalTimeZoneOffset).Date)
            .OrderBy(group => group.Key)
            .Select(group => new ExerciseProgressResult(
                DateOnly.FromDateTime(group.Key),
                group.Max(item => item.WeightKg),
                group.Sum(item => item.Reps),
                group.Sum(item => item.WeightKg * item.Reps)))
            .ToArray();
    }

    public async Task<StreakResult> GetStreakAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dates = await db.WorkoutSessions
            .AsNoTracking()
            .Where(session => session.UserId == userId && session.FinishedAt.HasValue)
            .Select(session => session.FinishedAt!.Value.Add(LocalTimeZoneOffset).Date)
            .ToListAsync(cancellationToken);

        var distinctDates = dates
            .Select(DateOnly.FromDateTime)
            .Distinct()
            .OrderBy(date => date)
            .ToArray();
        if (distinctDates.Length == 0)
            return new StreakResult(0, 0, null);

        var longest = 1;
        var currentRun = 1;
        for (var index = 1; index < distinctDates.Length; index++)
        {
            if (distinctDates[index] == distinctDates[index - 1].AddDays(1))
                currentRun++;
            else
                currentRun = 1;

            longest = Math.Max(longest, currentRun);
        }

        var lastDate = distinctDates[^1];
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Add(LocalTimeZoneOffset));
        var current = lastDate < today.AddDays(-1) ? 0 : 1;
        for (var index = distinctDates.Length - 1; current > 0 && index > 0; index--)
        {
            if (distinctDates[index] != distinctDates[index - 1].AddDays(1))
                break;

            current++;
        }

        return new StreakResult(current, longest, lastDate);
    }

    public async Task<ExerciseLatestPerformanceResult?> GetLatestPerformanceAsync(
        Guid userId,
        Guid exerciseId,
        Guid? excludeSessionId = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.WorkoutSets
            .AsNoTracking()
            .Where(s => s.Completed &&
                        s.ExerciseId == exerciseId &&
                        s.Session.UserId == userId);

        if (excludeSessionId.HasValue)
        {
            query = query.Where(s => s.SessionId != excludeSessionId.Value);
        }

        var latestSession = await query
            .OrderByDescending(s => s.Session.StartedAt)
            .Select(s => new { s.SessionId, s.Session.StartedAt })
            .FirstOrDefaultAsync(cancellationToken);

        if (latestSession is null)
        {
            return null;
        }

        var sets = await db.WorkoutSets
            .AsNoTracking()
            .Where(s => s.SessionId == latestSession.SessionId && s.ExerciseId == exerciseId && s.Completed)
            .OrderBy(s => s.SetNumber)
            .Select(s => new ExercisePerformanceSetResult(
                s.SetNumber,
                s.Reps,
                s.WeightKg,
                s.Completed))
            .ToListAsync(cancellationToken);

        if (sets.Count == 0)
        {
            return null;
        }

        var maxWeight = sets.Max(s => s.WeightKg);
        var totalReps = sets.Sum(s => s.Reps);
        var totalVolume = sets.Sum(s => s.WeightKg * s.Reps);
        var date = DateOnly.FromDateTime(latestSession.StartedAt.Add(LocalTimeZoneOffset).Date);

        return new ExerciseLatestPerformanceResult(
            exerciseId,
            date,
            maxWeight,
            totalReps,
            totalVolume,
            sets);
    }

    private static DateTime GetWeekStart(DateTime date)
    {
        var day = date.Date;
        var offset = ((int)day.DayOfWeek + 6) % 7;
        return day.AddDays(-offset);
    }
}
