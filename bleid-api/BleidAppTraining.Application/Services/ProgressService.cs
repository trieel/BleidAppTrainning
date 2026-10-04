using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Services;

public class ProgressService(IApplicationDbContext db) : IProgressService
{
    public async Task<IReadOnlyCollection<VolumeProgressResult>> GetVolumeAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var sets = await db.WorkoutSets
            .AsNoTracking()
            .Where(set => set.Completed && set.Session.UserId == userId)
            .Select(set => new { Date = set.Session.StartedAt, Volume = set.WeightKg * set.Reps })
            .ToListAsync(cancellationToken);

        return sets
            .GroupBy(item => GetWeekStart(item.Date))
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
            .GroupBy(item => item.Date.Date)
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
            .Select(session => session.FinishedAt!.Value.Date)
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
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var current = lastDate < today.AddDays(-1) ? 0 : 1;
        for (var index = distinctDates.Length - 1; current > 0 && index > 0; index--)
        {
            if (distinctDates[index] != distinctDates[index - 1].AddDays(1))
                break;

            current++;
        }

        return new StreakResult(current, longest, lastDate);
    }

    private static DateTime GetWeekStart(DateTime date)
    {
        var day = date.Date;
        var offset = ((int)day.DayOfWeek + 6) % 7;
        return day.AddDays(-offset);
    }
}
