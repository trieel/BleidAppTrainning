using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Services;

public class BodyWeightService(IApplicationDbContext db) : IBodyWeightService
{
    private static readonly TimeSpan LocalTimeZoneOffset = TimeSpan.FromHours(-3);

    public async Task<BodyWeightResult> LogAsync(
        Guid userId,
        LogBodyWeightCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.WeightKg <= 0 || command.WeightKg > 500)
            throw new ServiceValidationException("El peso corporal debe ser mayor a 0 kg y menor a 500 kg.");

        var targetDate = command.Date ?? DateOnly.FromDateTime(DateTime.UtcNow.Add(LocalTimeZoneOffset));

        var existing = await db.BodyWeightEntries
            .FirstOrDefaultAsync(e => e.UserId == userId && e.Date == targetDate, cancellationToken);

        if (existing is not null)
        {
            existing.WeightKg = command.WeightKg;
            if (!string.IsNullOrWhiteSpace(command.Notes))
            {
                existing.Notes = command.Notes.Trim();
            }
            await db.SaveChangesAsync(cancellationToken);
            return Map(existing);
        }

        var entry = new BodyWeightEntry
        {
            UserId = userId,
            WeightKg = command.WeightKg,
            Date = targetDate,
            Notes = command.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.BodyWeightEntries.Add(entry);
        await db.SaveChangesAsync(cancellationToken);

        return Map(entry);
    }

    public async Task<IReadOnlyCollection<BodyWeightResult>> GetHistoryAsync(
        Guid userId,
        int days = 90,
        CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateOnly.FromDateTime(DateTime.UtcNow.Add(LocalTimeZoneOffset)).AddDays(-days);

        var list = await db.BodyWeightEntries
            .AsNoTracking()
            .Where(e => e.UserId == userId && e.Date >= cutoffDate)
            .OrderByDescending(e => e.Date)
            .ToListAsync(cancellationToken);

        return list.Select(Map).ToArray();
    }

    public async Task<BodyWeightResult?> GetLatestAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var entry = await db.BodyWeightEntries
            .AsNoTracking()
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.Date)
            .FirstOrDefaultAsync(cancellationToken);

        return entry is null ? null : Map(entry);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var entry = await db.BodyWeightEntries
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId, cancellationToken);

        if (entry is null) return;

        db.BodyWeightEntries.Remove(entry);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static BodyWeightResult Map(BodyWeightEntry e) =>
        new(e.Id, e.WeightKg, e.Date, e.Notes, e.CreatedAt);
}
