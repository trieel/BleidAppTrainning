using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class BodyWeightServiceTests
{
    [Fact]
    public async Task LogAsync_WhenValid_CreatesEntry()
    {
        using var db = TestDbContextFactory.Create(nameof(LogAsync_WhenValid_CreatesEntry));
        var userId = Guid.NewGuid();
        var service = new BodyWeightService(db);

        var date = new DateOnly(2026, 10, 25);
        var result = await service.LogAsync(userId, new LogBodyWeightCommand
        {
            WeightKg = 78.5m,
            Date = date,
            Notes = "En ayunas"
        });

        Assert.NotNull(result);
        Assert.Equal(78.5m, result.WeightKg);
        Assert.Equal(date, result.Date);
        Assert.Equal("En ayunas", result.Notes);
    }

    [Fact]
    public async Task LogAsync_WhenSameDate_UpdatesExistingEntry()
    {
        using var db = TestDbContextFactory.Create(nameof(LogAsync_WhenSameDate_UpdatesExistingEntry));
        var userId = Guid.NewGuid();
        var service = new BodyWeightService(db);

        var date = new DateOnly(2026, 10, 25);
        await service.LogAsync(userId, new LogBodyWeightCommand
        {
            WeightKg = 78.5m,
            Date = date,
            Notes = "Mañana"
        });

        var updated = await service.LogAsync(userId, new LogBodyWeightCommand
        {
            WeightKg = 78.2m,
            Date = date,
            Notes = "Noche corregido"
        });

        Assert.Equal(78.2m, updated.WeightKg);
        Assert.Equal("Noche corregido", updated.Notes);

        var history = await service.GetHistoryAsync(userId, 30);
        Assert.Single(history);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(600)]
    public async Task LogAsync_WhenWeightIsInvalid_ThrowsServiceValidationException(decimal invalidWeight)
    {
        using var db = TestDbContextFactory.Create($"{nameof(LogAsync_WhenWeightIsInvalid_ThrowsServiceValidationException)}_{invalidWeight}");
        var userId = Guid.NewGuid();
        var service = new BodyWeightService(db);

        var act = () => service.LogAsync(userId, new LogBodyWeightCommand
        {
            WeightKg = invalidWeight
        });

        var ex = await Assert.ThrowsAsync<ServiceValidationException>(act);
        Assert.Contains(ex.Errors, e => e.Contains("0 kg y menor a 500 kg"));
    }

    [Fact]
    public async Task GetHistoryAsync_OrdersByDateDescending()
    {
        using var db = TestDbContextFactory.Create(nameof(GetHistoryAsync_OrdersByDateDescending));
        var userId = Guid.NewGuid();
        var service = new BodyWeightService(db);

        await service.LogAsync(userId, new LogBodyWeightCommand { WeightKg = 80m, Date = new DateOnly(2026, 10, 20) });
        await service.LogAsync(userId, new LogBodyWeightCommand { WeightKg = 79.5m, Date = new DateOnly(2026, 10, 22) });
        await service.LogAsync(userId, new LogBodyWeightCommand { WeightKg = 79.1m, Date = new DateOnly(2026, 10, 25) });

        var history = await service.GetHistoryAsync(userId, 30);

        Assert.Equal(3, history.Count);
        Assert.Equal(new DateOnly(2026, 10, 25), history.First().Date);
        Assert.Equal(new DateOnly(2026, 10, 20), history.Last().Date);
    }
}
