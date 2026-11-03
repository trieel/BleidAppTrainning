using BleidAppTraining.Application.Common;
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
            SessionMin = 60,
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
        Assert.Equal(60, updated.SessionMin);
        Assert.Equal(2, updated.Limitations.Count);
    }

    [Theory]
    [InlineData(20)]
    [InlineData(50)]
    [InlineData(75)]
    [InlineData(90)]
    [InlineData(120)]
    public async Task UpdateProfileAsync_WhenSessionMinIsInvalid_ThrowsServiceValidationException(int invalidMinutes)
    {
        using var db = TestDbContextFactory.Create(nameof(UpdateProfileAsync_WhenSessionMinIsInvalid_ThrowsServiceValidationException) + invalidMinutes);
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@bleid.app",
            UserName = "test@bleid.app",
            FullName = "Test Athlete",
            DaysPerWeek = 3
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new AuthService(null!, null!, null!, db);
        var ex = await Assert.ThrowsAsync<ServiceValidationException>(() => service.UpdateProfileAsync(userId, new UpdateProfileCommand
        {
            SessionMin = invalidMinutes
        }));

        Assert.Contains("30, 45 o 60", ex.Message);
    }

    private class TestTokenService : BleidAppTraining.Application.Interfaces.IJwtTokenService
    {
        public string CreateToken(User user, IEnumerable<string> roles) => "valid-jwt-token-" + user.Id;

        public System.Security.Claims.ClaimsPrincipal? GetPrincipalFromToken(string token, bool allowGracePeriod = true)
        {
            if (token.StartsWith("valid-jwt-token-"))
            {
                var id = token["valid-jwt-token-".Length..];
                var claims = new[]
                {
                    new System.Security.Claims.Claim("userId", id),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, id)
                };
                return new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(claims, "Test"));
            }
            return null;
        }
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenUserExists_ReturnsNewTokenAndProfile()
    {
        using var db = TestDbContextFactory.Create(nameof(RefreshTokenAsync_WhenUserExists_ReturnsNewTokenAndProfile));
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "atleta.persistente@bleid.app",
            UserName = "atleta.persistente@bleid.app",
            FullName = "Atleta Persistente",
            DaysPerWeek = 4
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new AuthService(null!, null!, new TestTokenService(), db);
        var authResult = await service.RefreshTokenAsync(userId);

        Assert.NotNull(authResult);
        Assert.Equal("valid-jwt-token-" + userId, authResult.Token);
        Assert.Equal("Atleta Persistente", authResult.User.FullName);
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenUserDoesNotExist_ThrowsKeyNotFoundException()
    {
        using var db = TestDbContextFactory.Create(nameof(RefreshTokenAsync_WhenUserDoesNotExist_ThrowsKeyNotFoundException));
        var service = new AuthService(null!, null!, new TestTokenService(), db);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.RefreshTokenAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task RefreshTokenWithGracePeriodAsync_WhenTokenIsValid_ReturnsNewToken()
    {
        using var db = TestDbContextFactory.Create(nameof(RefreshTokenWithGracePeriodAsync_WhenTokenIsValid_ReturnsNewToken));
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "atleta.gracia@bleid.app",
            UserName = "atleta.gracia@bleid.app",
            FullName = "Atleta Gracia",
            DaysPerWeek = 4
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new AuthService(null!, null!, new TestTokenService(), db);
        var authResult = await service.RefreshTokenWithGracePeriodAsync("valid-jwt-token-" + userId);

        Assert.NotNull(authResult);
        Assert.Equal("valid-jwt-token-" + userId, authResult.Token);
        Assert.Equal("Atleta Gracia", authResult.User.FullName);
    }

    [Fact]
    public async Task RefreshTokenWithGracePeriodAsync_WhenTokenIsInvalid_ThrowsServiceValidationException()
    {
        using var db = TestDbContextFactory.Create(nameof(RefreshTokenWithGracePeriodAsync_WhenTokenIsInvalid_ThrowsServiceValidationException));
        var service = new AuthService(null!, null!, new TestTokenService(), db);

        var ex = await Assert.ThrowsAsync<ServiceValidationException>(() => 
            service.RefreshTokenWithGracePeriodAsync("invalid-tampered-token"));
        Assert.Contains("grace period", ex.Message);
    }
    }
}
