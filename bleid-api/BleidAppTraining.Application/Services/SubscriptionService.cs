using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BleidAppTraining.Application.Services;

public class SubscriptionService(
    IApplicationDbContext db,
    IMercadoPagoClient mpClient,
    ILogger<SubscriptionService> logger) : ISubscriptionService
{
    private const decimal DefaultMonthlyPriceArs = 6500.00m;

    public async Task<SubscriptionCheckoutResult> CreateCheckoutSessionAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("The authenticated user was not found.");

        var email = user.Email ?? $"{userId}@bleidapp.com";
        var request = new CreatePreapprovalRequest(
            PayerEmail: email,
            BackUrl: "http://localhost:3000/subscription/callback",
            Reason: "BleidApp Training - Plan Pro (+4 días)",
            AutoRecurringAmount: DefaultMonthlyPriceArs,
            CurrencyId: "ARS",
            ExternalReference: userId.ToString()
        );

        var mpResponse = await mpClient.CreatePreapprovalAsync(request, ct);

        var subscription = new Subscription
        {
            UserId = userId,
            ExternalPreapprovalId = mpResponse.Id,
            PayerEmail = email,
            Status = SubscriptionStatus.Pending,
            Amount = DefaultMonthlyPriceArs,
            CurrencyId = "ARS",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Subscriptions.Add(subscription);
        await db.SaveChangesAsync(ct);

        return new SubscriptionCheckoutResult(mpResponse.InitPoint, mpResponse.Id);
    }

    public async Task<SubscriptionStatusResult> VerifySessionAsync(
        Guid userId,
        string preapprovalId,
        CancellationToken ct = default)
    {
        var mpResponse = await mpClient.GetPreapprovalAsync(preapprovalId, ct);
        if (mpResponse is null)
        {
            return new SubscriptionStatusResult(false, null, null);
        }

        var subscription = await db.Subscriptions
            .SingleOrDefaultAsync(s => s.ExternalPreapprovalId == preapprovalId, ct);

        if (subscription is null)
        {
            subscription = new Subscription
            {
                UserId = userId,
                ExternalPreapprovalId = preapprovalId,
                PayerEmail = mpResponse.PayerEmail,
                Amount = DefaultMonthlyPriceArs,
                CurrencyId = "ARS"
            };
            db.Subscriptions.Add(subscription);
        }

        if (string.Equals(mpResponse.Status, "authorized", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(mpResponse.Status, "approved", StringComparison.OrdinalIgnoreCase))
        {
            subscription.Status = SubscriptionStatus.Active;
            subscription.CurrentPeriodEnd = mpResponse.NextPaymentDate ?? DateTime.UtcNow.AddMonths(1);
            subscription.UpdatedAt = DateTime.UtcNow;

            await ReactivateDaysAsync(userId, ct);
        }
        else if (string.Equals(mpResponse.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
        {
            subscription.Status = SubscriptionStatus.Cancelled;
            subscription.CancelledAt = DateTime.UtcNow;
            subscription.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        var isPro = subscription.Status == SubscriptionStatus.Active &&
                    (subscription.CurrentPeriodEnd == null || subscription.CurrentPeriodEnd >= DateTime.UtcNow);

        return new SubscriptionStatusResult(isPro, subscription.Status, subscription.CurrentPeriodEnd);
    }

    public async Task<SubscriptionStatusResult> GetStatusAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var subscription = await db.Subscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (subscription is null || subscription.Status != SubscriptionStatus.Active)
        {
            return new SubscriptionStatusResult(false, subscription?.Status, subscription?.CurrentPeriodEnd);
        }

        if (subscription.CurrentPeriodEnd.HasValue && subscription.CurrentPeriodEnd.Value < DateTime.UtcNow)
        {
            logger.LogInformation("Subscription period expired for user {UserId}. Enforcing downgrade.", userId);
            subscription.Status = SubscriptionStatus.Cancelled;
            subscription.UpdatedAt = DateTime.UtcNow;
            await EnforceDowngradeAsync(userId, ct);
            await db.SaveChangesAsync(ct);
            return new SubscriptionStatusResult(false, subscription.Status, subscription.CurrentPeriodEnd);
        }

        return new SubscriptionStatusResult(true, subscription.Status, subscription.CurrentPeriodEnd);
    }

    public async Task<bool> CancelAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var subscription = await db.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (subscription is null) return false;

        await mpClient.CancelPreapprovalAsync(subscription.ExternalPreapprovalId, ct);
        subscription.CancelledAt = DateTime.UtcNow;
        subscription.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> HandleWebhookAsync(
        MercadoPagoWebhookDto dto,
        string? signature,
        CancellationToken ct = default)
    {
        if (dto.Data?.Id is null) return true;

        var preapprovalId = dto.Data.Id;
        var mpInfo = await mpClient.GetPreapprovalAsync(preapprovalId, ct);
        if (mpInfo is null) return true;

        var subscription = await db.Subscriptions
            .SingleOrDefaultAsync(s => s.ExternalPreapprovalId == preapprovalId, ct);

        if (subscription is null) return true;

        if (string.Equals(mpInfo.Status, "authorized", StringComparison.OrdinalIgnoreCase))
        {
            subscription.Status = SubscriptionStatus.Active;
            subscription.CurrentPeriodEnd = mpInfo.NextPaymentDate ?? DateTime.UtcNow.AddMonths(1);
            subscription.UpdatedAt = DateTime.UtcNow;
            await ReactivateDaysAsync(subscription.UserId, ct);
        }
        else if (string.Equals(mpInfo.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
        {
            subscription.Status = SubscriptionStatus.Cancelled;
            subscription.CancelledAt = DateTime.UtcNow;
            subscription.UpdatedAt = DateTime.UtcNow;

            if (subscription.CurrentPeriodEnd == null || subscription.CurrentPeriodEnd <= DateTime.UtcNow)
            {
                await EnforceDowngradeAsync(subscription.UserId, ct);
            }
        }
        else if (string.Equals(mpInfo.Status, "paused", StringComparison.OrdinalIgnoreCase))
        {
            subscription.Status = SubscriptionStatus.PastDue;
            subscription.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task EnforceDowngradeAsync(Guid userId, CancellationToken ct = default)
    {
        var userRoutine = await db.UserRoutines
            .Where(ur => ur.UserId == userId && ur.IsActive)
            .Include(ur => ur.Routine)
                .ThenInclude(r => r.Days)
            .SingleOrDefaultAsync(ct);

        if (userRoutine?.Routine is null) return;

        var routine = userRoutine.Routine;
        var activeDays = routine.Days.Where(d => d.IsActive).OrderBy(d => d.Order).ToList();

        if (activeDays.Count <= 4) return;

        // Keep the first 4 active days, deactivate days 5 and beyond
        for (var i = 4; i < activeDays.Count; i++)
        {
            activeDays[i].IsActive = false;
        }

        routine.DaysPerWeek = 4;

        // Also update the user's preferred days per week if > 4
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
        if (user is not null && user.DaysPerWeek > 4)
        {
            user.DaysPerWeek = 4;
        }
    }

    private async Task ReactivateDaysAsync(Guid userId, CancellationToken ct)
    {
        var userRoutine = await db.UserRoutines
            .Where(ur => ur.UserId == userId && ur.IsActive)
            .Include(ur => ur.Routine)
                .ThenInclude(r => r.Days)
            .SingleOrDefaultAsync(ct);

        if (userRoutine?.Routine is null) return;

        var routine = userRoutine.Routine;
        var inactiveDays = routine.Days.Where(d => !d.IsActive).ToList();
        if (inactiveDays.Count == 0) return;

        foreach (var day in inactiveDays)
        {
            day.IsActive = true;
        }

        routine.DaysPerWeek = routine.Days.Count(d => d.IsActive);

        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
        if (user is not null)
        {
            user.DaysPerWeek = routine.DaysPerWeek;
        }
    }
}
