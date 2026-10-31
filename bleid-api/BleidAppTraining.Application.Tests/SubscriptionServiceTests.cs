using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class SubscriptionServiceTests
{
    private class FakeMercadoPagoClient : IMercadoPagoClient
    {
        public string NextStatus { get; set; } = "authorized";
        public DateTime? NextPaymentDate { get; set; } = DateTime.UtcNow.AddMonths(1);

        public Task<MercadoPagoPreapprovalResponse> CreatePreapprovalAsync(CreatePreapprovalRequest request, CancellationToken ct = default)
        {
            return Task.FromResult(new MercadoPagoPreapprovalResponse(
                "preapproval_123",
                "https://mercadopago.com/checkout/123",
                NextStatus,
                request.PayerEmail,
                NextPaymentDate,
                DateTime.UtcNow
            ));
        }

        public Task<MercadoPagoPreapprovalResponse?> GetPreapprovalAsync(string preapprovalId, CancellationToken ct = default)
        {
            return Task.FromResult<MercadoPagoPreapprovalResponse?>(new MercadoPagoPreapprovalResponse(
                preapprovalId,
                $"https://mercadopago.com/checkout/{preapprovalId}",
                NextStatus,
                "user@bleidapp.com",
                NextPaymentDate,
                DateTime.UtcNow
            ));
        }

        public Task<bool> CancelPreapprovalAsync(string preapprovalId, CancellationToken ct = default)
        {
            return Task.FromResult(true);
        }
    }

    [Fact]
    public async Task GetStatusAsync_WhenNoSubscription_ReturnsIsProActiveFalse()
    {
        var db = TestDbContextFactory.Create(nameof(GetStatusAsync_WhenNoSubscription_ReturnsIsProActiveFalse));
        var userId = Guid.NewGuid();
        var service = new SubscriptionService(db, new FakeMercadoPagoClient(), NullLogger<SubscriptionService>.Instance);

        var status = await service.GetStatusAsync(userId);

        Assert.False(status.IsProActive);
        Assert.Null(status.Status);
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_CreatesPendingSubscriptionAndReturnsInitPoint()
    {
        var db = TestDbContextFactory.Create(nameof(CreateCheckoutSessionAsync_CreatesPendingSubscriptionAndReturnsInitPoint));
        var userId = Guid.NewGuid();
        db.Users.Add(new User { Id = userId, Email = "test@bleidapp.com", FullName = "Test User" });
        await db.SaveChangesAsync();

        var service = new SubscriptionService(db, new FakeMercadoPagoClient(), NullLogger<SubscriptionService>.Instance);

        var result = await service.CreateCheckoutSessionAsync(userId);

        Assert.Equal("preapproval_123", result.PreapprovalId);
        Assert.Equal("https://mercadopago.com/checkout/123", result.InitPoint);

        var stored = db.Subscriptions.Single(s => s.UserId == userId);
        Assert.Equal(SubscriptionStatus.Pending, stored.Status);
    }

    [Fact]
    public async Task VerifySessionAsync_WhenMpApproved_ActivatesSubscriptionAndSetsCurrentPeriodEnd()
    {
        var db = TestDbContextFactory.Create(nameof(VerifySessionAsync_WhenMpApproved_ActivatesSubscriptionAndSetsCurrentPeriodEnd));
        var userId = Guid.NewGuid();
        db.Users.Add(new User { Id = userId, Email = "test@bleidapp.com", FullName = "Test User" });
        await db.SaveChangesAsync();

        var fakeMp = new FakeMercadoPagoClient { NextStatus = "authorized" };
        var service = new SubscriptionService(db, fakeMp, NullLogger<SubscriptionService>.Instance);

        var result = await service.VerifySessionAsync(userId, "preapproval_123");

        Assert.True(result.IsProActive);
        Assert.Equal(SubscriptionStatus.Active, result.Status);
        Assert.NotNull(result.CurrentPeriodEnd);
    }

    [Fact]
    public async Task GetStatusAsync_WhenCurrentPeriodEndExpired_TriggersDowngradeAndReturnsFalse()
    {
        var db = TestDbContextFactory.Create(nameof(GetStatusAsync_WhenCurrentPeriodEndExpired_TriggersDowngradeAndReturnsFalse));
        var userId = Guid.NewGuid();
        db.Users.Add(new User { Id = userId, Email = "test@bleidapp.com", FullName = "Test User", DaysPerWeek = 5 });

        // Add 5-day routine
        var routine = new Routine { Id = Guid.NewGuid(), DaysPerWeek = 5, Name = "Rutina 5 días" };
        for (int i = 1; i <= 5; i++)
        {
            routine.Days.Add(new RoutineDay { RoutineId = routine.Id, DayNumber = i, Order = i, Name = $"Día {i}", IsActive = true });
        }
        db.Routines.Add(routine);
        db.UserRoutines.Add(new UserRoutine { UserId = userId, RoutineId = routine.Id, IsActive = true });

        // Expired subscription
        db.Subscriptions.Add(new Subscription
        {
            UserId = userId,
            ExternalPreapprovalId = "sub_exp",
            Status = SubscriptionStatus.Active,
            CurrentPeriodEnd = DateTime.UtcNow.AddDays(-1)
        });
        await db.SaveChangesAsync();

        var service = new SubscriptionService(db, new FakeMercadoPagoClient(), NullLogger<SubscriptionService>.Instance);

        var status = await service.GetStatusAsync(userId);

        Assert.False(status.IsProActive);
        Assert.Equal(SubscriptionStatus.Cancelled, status.Status);

        // Verify downgrade
        var updatedRoutine = db.Routines.Single(r => r.Id == routine.Id);
        Assert.Equal(4, updatedRoutine.DaysPerWeek);
        Assert.Equal(4, updatedRoutine.Days.Count(d => d.IsActive));
        Assert.False(updatedRoutine.Days.Single(d => d.DayNumber == 5).IsActive);
    }

    [Fact]
    public async Task EnforceDowngradeAsync_DeactivatesDaysBeyond4_PreservingExistingWorkoutSessions()
    {
        var db = TestDbContextFactory.Create(nameof(EnforceDowngradeAsync_DeactivatesDaysBeyond4_PreservingExistingWorkoutSessions));
        var userId = Guid.NewGuid();
        db.Users.Add(new User { Id = userId, Email = "test@bleidapp.com", FullName = "Test User", DaysPerWeek = 6 });

        var routine = new Routine { Id = Guid.NewGuid(), DaysPerWeek = 6, Name = "Rutina 6 días" };
        for (int i = 1; i <= 6; i++)
        {
            var day = new RoutineDay { RoutineId = routine.Id, DayNumber = i, Order = i, Name = $"Día {i}", IsActive = true };
            routine.Days.Add(day);
            if (i == 5)
            {
                // Day 5 has recorded session
                day.WorkoutSessions.Add(new WorkoutSession { UserId = userId, RoutineDayId = day.Id, StartedAt = DateTime.UtcNow.AddDays(-2) });
            }
        }
        db.Routines.Add(routine);
        db.UserRoutines.Add(new UserRoutine { UserId = userId, RoutineId = routine.Id, IsActive = true });
        await db.SaveChangesAsync();

        var service = new SubscriptionService(db, new FakeMercadoPagoClient(), NullLogger<SubscriptionService>.Instance);

        await service.EnforceDowngradeAsync(userId);
        await db.SaveChangesAsync();

        var reloadedRoutine = db.Routines.Single(r => r.Id == routine.Id);
        Assert.Equal(4, reloadedRoutine.DaysPerWeek);
        Assert.Equal(4, reloadedRoutine.Days.Count(d => d.IsActive));

        // Days 5 and 6 are marked IsActive = false, but Day 5 workout session still exists!
        var day5 = reloadedRoutine.Days.Single(d => d.DayNumber == 5);
        Assert.False(day5.IsActive);
        Assert.Single(db.WorkoutSessions);
    }
}
