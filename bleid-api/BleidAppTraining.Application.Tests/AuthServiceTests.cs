using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using BleidAppTraining.Infrastructure.Identity;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task UpdateProfileAsync_UpdatesGoalLevelAndLimitations()
    {
        using var db = TestDbContextFactory.Create(nameof(UpdateProfileAsync_UpdatesGoalLevelAndLimitations));
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "atleta@bleid.app",
            UserName = "atleta@bleid.app",
            FullName = "Atleta Bleid",
            Goal = GoalType.LoseWeight,
            Level = LevelType.Beginner,
            DaysPerWeek = 3
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new AuthService(null!, null!, null!, db);
        var updated = await service.UpdateProfileAsync(userId, new UpdateProfileCommand
        {
            FullName = "Atleta Bleid Pro",
            Age = 26,
            Goal = GoalType.GainMuscle,
            Level = LevelType.Advanced,
            DaysPerWeek = 5,
            SessionMin = 75,
            Limitations =
            [
                new UserLimitationInput { Type = LimitationType.Knee, Severity = SeverityType.Moderate },
                new UserLimitationInput { Type = LimitationType.Lumbar, Severity = SeverityType.Mild }
            ]
        });

        Assert.Equal("Atleta Bleid Pro", updated.FullName);
        Assert.Equal(26, updated.Age);
        Assert.Equal(GoalType.GainMuscle, updated.Goal);
        Assert.Equal(LevelType.Advanced, updated.Level);
        Assert.Equal(5, updated.DaysPerWeek);
        Assert.Equal(75, updated.SessionMin);
        Assert.Equal(2, updated.Limitations.Count);
    }
}
