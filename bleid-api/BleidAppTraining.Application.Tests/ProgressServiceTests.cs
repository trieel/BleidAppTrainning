using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class ProgressServiceTests
{
    [Fact]
    public async Task GetStreakAsync_WhenNoSessions_ReturnsZero()
    {
        using var db = TestDbContextFactory.Create(nameof(GetStreakAsync_WhenNoSessions_ReturnsZero));
        var userId = Guid.NewGuid();
        var service = new ProgressService(db);

        var result = await service.GetStreakAsync(userId);

        Assert.Equal(0, result.CurrentDays);
        Assert.Equal(0, result.LongestDays);
        Assert.Null(result.LastWorkoutDate);
    }

    [Fact]
    public async Task GetStreakAsync_WhenFinishedSessionToday_ReturnsAtLeastOne()
    {
        using var db = TestDbContextFactory.Create(nameof(GetStreakAsync_WhenFinishedSessionToday_ReturnsAtLeastOne));
        var userId = Guid.NewGuid();
        var dayId = Guid.NewGuid();

        db.WorkoutSessions.Add(new WorkoutSession
        {
            UserId = userId,
            RoutineDayId = dayId,
            StartedAt = DateTime.UtcNow.AddMinutes(-45),
            FinishedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = new ProgressService(db);
        var result = await service.GetStreakAsync(userId);

        Assert.Equal(1, result.CurrentDays);
        Assert.Equal(1, result.LongestDays);
        Assert.NotNull(result.LastWorkoutDate);
    }

    [Fact]
    public async Task GetStreakAsync_ConsecutiveDays_CalculatesStreakCorrectly()
    {
        using var db = TestDbContextFactory.Create(nameof(GetStreakAsync_ConsecutiveDays_CalculatesStreakCorrectly));
        var userId = Guid.NewGuid();
        var dayId = Guid.NewGuid();

        // 3 consecutive days: today, yesterday, 2 days ago
        var now = DateTime.UtcNow;
        db.WorkoutSessions.AddRange(
            new WorkoutSession
            {
                UserId = userId,
                RoutineDayId = dayId,
                StartedAt = now.AddDays(-2).AddHours(-1),
                FinishedAt = now.AddDays(-2)
            },
            new WorkoutSession
            {
                UserId = userId,
                RoutineDayId = dayId,
                StartedAt = now.AddDays(-1).AddHours(-1),
                FinishedAt = now.AddDays(-1)
            },
            new WorkoutSession
            {
                UserId = userId,
                RoutineDayId = dayId,
                StartedAt = now.AddHours(-1),
                FinishedAt = now
            }
        );
        await db.SaveChangesAsync();

        var service = new ProgressService(db);
        var result = await service.GetStreakAsync(userId);

        Assert.Equal(3, result.CurrentDays);
        Assert.Equal(3, result.LongestDays);
    }

    [Fact]
    public async Task GetStreakAsync_BrokenStreak_ReturnsZeroCurrentStreak()
    {
        using var db = TestDbContextFactory.Create(nameof(GetStreakAsync_BrokenStreak_ReturnsZeroCurrentStreak));
        var userId = Guid.NewGuid();
        var dayId = Guid.NewGuid();

        // Session was 5 days ago, nothing since
        var now = DateTime.UtcNow;
        db.WorkoutSessions.Add(new WorkoutSession
        {
            UserId = userId,
            RoutineDayId = dayId,
            StartedAt = now.AddDays(-5).AddHours(-1),
            FinishedAt = now.AddDays(-5)
        });
        await db.SaveChangesAsync();

        var service = new ProgressService(db);
        var result = await service.GetStreakAsync(userId);

        Assert.Equal(0, result.CurrentDays);
        Assert.Equal(1, result.LongestDays);
    }

    [Fact]
    public async Task GetLatestPerformanceAsync_WhenNoSets_ReturnsNull()
    {
        using var db = TestDbContextFactory.Create(nameof(GetLatestPerformanceAsync_WhenNoSets_ReturnsNull));
        var userId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();
        var service = new ProgressService(db);

        var result = await service.GetLatestPerformanceAsync(userId, exerciseId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetLatestPerformanceAsync_WhenSetsExist_ReturnsLatestCompletedSetsAndExcludesCurrent()
    {
        using var db = TestDbContextFactory.Create(nameof(GetLatestPerformanceAsync_WhenSetsExist_ReturnsLatestCompletedSetsAndExcludesCurrent));
        var userId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();
        var dayId = Guid.NewGuid();

        var oldSession = new WorkoutSession
        {
            UserId = userId,
            RoutineDayId = dayId,
            StartedAt = DateTime.UtcNow.AddDays(-3),
            FinishedAt = DateTime.UtcNow.AddDays(-3).AddHours(1)
        };
        var currentSession = new WorkoutSession
        {
            UserId = userId,
            RoutineDayId = dayId,
            StartedAt = DateTime.UtcNow,
            FinishedAt = null
        };
        db.WorkoutSessions.AddRange(oldSession, currentSession);

        db.WorkoutSets.AddRange(
            new WorkoutSet
            {
                SessionId = oldSession.Id,
                ExerciseId = exerciseId,
                SetNumber = 1,
                Reps = 10,
                WeightKg = 80m,
                Completed = true
            },
            new WorkoutSet
            {
                SessionId = oldSession.Id,
                ExerciseId = exerciseId,
                SetNumber = 2,
                Reps = 8,
                WeightKg = 85m,
                Completed = true
            },
            new WorkoutSet
            {
                SessionId = oldSession.Id,
                ExerciseId = exerciseId,
                SetNumber = 3,
                Reps = 6,
                WeightKg = 90m,
                Completed = false // uncompleted set shouldn't be counted as a completed performance
            },
            new WorkoutSet
            {
                SessionId = currentSession.Id,
                ExerciseId = exerciseId,
                SetNumber = 1,
                Reps = 5,
                WeightKg = 20m,
                Completed = true
            }
        );
        await db.SaveChangesAsync();

        var service = new ProgressService(db);
        var result = await service.GetLatestPerformanceAsync(userId, exerciseId, excludeSessionId: currentSession.Id);

        Assert.NotNull(result);
        Assert.Equal(exerciseId, result.ExerciseId);
        Assert.Equal(85m, result.MaxWeightKg);
        Assert.Equal(18, result.TotalReps); // 10 + 8
        Assert.Equal(2, result.Sets.Count);
        Assert.Equal(1, result.Sets.First().SetNumber);
        Assert.Equal(80m, result.Sets.First().WeightKg);
    }
}
