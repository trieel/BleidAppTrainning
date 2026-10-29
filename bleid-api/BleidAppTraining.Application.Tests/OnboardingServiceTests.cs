using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class OnboardingServiceTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    public async Task CompleteAsync_WhenDaysPerWeekInvalid_ThrowsServiceValidationException(int days)
    {
        using var db = TestDbContextFactory.Create(nameof(CompleteAsync_WhenDaysPerWeekInvalid_ThrowsServiceValidationException) + days);
        var userId = Guid.NewGuid();
        var routineService = new RoutineService(db);
        var service = new OnboardingService(db, routineService);

        var command = new OnboardingCommand
        {
            Goal = GoalType.GainMuscle,
            Level = LevelType.Beginner,
            DaysPerWeek = days,
            SessionMin = 45,
            Age = 25,
            Sex = SexType.Male,
            Limitations = []
        };

        var ex = await Assert.ThrowsAsync<ServiceValidationException>(() => service.CompleteAsync(userId, command));
        Assert.Contains(ex.Errors, e => e.Contains("DaysPerWeek"));
    }

    [Theory]
    [InlineData(20)]
    [InlineData(40)]
    [InlineData(75)]
    public async Task CompleteAsync_WhenSessionMinInvalid_ThrowsServiceValidationException(int minutes)
    {
        using var db = TestDbContextFactory.Create(nameof(CompleteAsync_WhenSessionMinInvalid_ThrowsServiceValidationException) + minutes);
        var userId = Guid.NewGuid();
        var routineService = new RoutineService(db);
        var service = new OnboardingService(db, routineService);

        var command = new OnboardingCommand
        {
            Goal = GoalType.GainMuscle,
            Level = LevelType.Beginner,
            DaysPerWeek = 3,
            SessionMin = minutes,
            Age = 25,
            Sex = SexType.Male,
            Limitations = []
        };

        var ex = await Assert.ThrowsAsync<ServiceValidationException>(() => service.CompleteAsync(userId, command));
        Assert.Contains(ex.Errors, e => e.Contains("SessionMin"));
    }

    [Theory]
    [InlineData(11)]
    [InlineData(105)]
    public async Task CompleteAsync_WhenAgeInvalid_ThrowsServiceValidationException(int age)
    {
        using var db = TestDbContextFactory.Create(nameof(CompleteAsync_WhenAgeInvalid_ThrowsServiceValidationException) + age);
        var userId = Guid.NewGuid();
        var routineService = new RoutineService(db);
        var service = new OnboardingService(db, routineService);

        var command = new OnboardingCommand
        {
            Goal = GoalType.GainMuscle,
            Level = LevelType.Beginner,
            DaysPerWeek = 3,
            SessionMin = 60,
            Age = age,
            Sex = SexType.Male,
            Limitations = []
        };

        var ex = await Assert.ThrowsAsync<ServiceValidationException>(() => service.CompleteAsync(userId, command));
        Assert.Contains(ex.Errors, e => e.Contains("Age"));
    }

    [Fact]
    public async Task CompleteAsync_WhenUserNotFound_ThrowsKeyNotFoundException()
    {
        using var db = TestDbContextFactory.Create(nameof(CompleteAsync_WhenUserNotFound_ThrowsKeyNotFoundException));
        var userId = Guid.NewGuid();
        var routineService = new RoutineService(db);
        var service = new OnboardingService(db, routineService);

        var command = new OnboardingCommand
        {
            Goal = GoalType.GainMuscle,
            Level = LevelType.Beginner,
            DaysPerWeek = 3,
            SessionMin = 60,
            Age = 25,
            Sex = SexType.Male,
            Limitations = []
        };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.CompleteAsync(userId, command));
    }

    [Fact]
    public async Task CompleteAsync_WhenValid_UpdatesUserAndAssignsRoutine()
    {
        using var db = TestDbContextFactory.Create(nameof(CompleteAsync_WhenValid_UpdatesUserAndAssignsRoutine));
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "atleta@bleid.app",
            UserName = "atleta@bleid.app",
            FullName = "Atleta Bleid",
            DaysPerWeek = 3
        };
        db.Users.Add(user);

        // Seed template routine
        var template = new Routine
        {
            Id = Guid.NewGuid(),
            Name = "Template Hipertrofia 3 Días",
            Goal = GoalType.GainMuscle,
            Level = LevelType.Beginner,
            DaysPerWeek = 3,
            IsTemplate = true
        };
        var day = new RoutineDay
        {
            Id = Guid.NewGuid(),
            RoutineId = template.Id,
            DayNumber = 1,
            Name = "Día 1 - Full Body",
            Order = 1
        };
        template.Days.Add(day);
        db.Routines.Add(template);
        db.RoutineDays.Add(day);
        await db.SaveChangesAsync();

        var routineService = new RoutineService(db);
        var service = new OnboardingService(db, routineService);

        var command = new OnboardingCommand
        {
            Goal = GoalType.GainMuscle,
            Level = LevelType.Beginner,
            DaysPerWeek = 3,
            SessionMin = 60,
            Age = 28,
            Sex = SexType.Male,
            Limitations =
            [
                new LimitationInput { Type = LimitationType.Knee, Severity = SeverityType.Mild }
            ]
        };

        var result = await service.CompleteAsync(userId, command);

        Assert.NotNull(result);
        Assert.Equal("Atleta Bleid", result.User.FullName);
        Assert.Equal(28, result.User.Age);
        Assert.Equal(GoalType.GainMuscle, result.User.Goal);
        Assert.Equal(LevelType.Beginner, result.User.Level);
        Assert.Equal(60, result.User.SessionMin);
        Assert.Single(result.User.Limitations);
        Assert.NotNull(result.Routine);
        Assert.Equal("Template Hipertrofia 3 Días", result.Routine.Name);
    }
}
