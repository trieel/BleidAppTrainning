using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Services;

public class OnboardingService(IApplicationDbContext db, IRoutineService routineService) : IOnboardingService
{
    public async Task<OnboardingResult> CompleteAsync(
        Guid userId,
        OnboardingCommand command,
        CancellationToken cancellationToken = default)
    {
        Validate(command);

        var user = await db.Users
            .Include(item => item.Limitations)
            .SingleOrDefaultAsync(item => item.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("The authenticated user was not found.");

        user.Goal = command.Goal;
        user.Level = command.Level;
        user.DaysPerWeek = command.DaysPerWeek;
        user.SessionMin = command.SessionMin;
        user.Age = command.Age;
        user.Sex = command.Sex;

        db.UserLimitations.RemoveRange(user.Limitations);
        foreach (var limitation in command.Limitations.DistinctBy(item => item.Type))
        {
            db.UserLimitations.Add(new Domain.Entities.UserLimitation
            {
                UserId = userId,
                Type = limitation.Type,
                Severity = limitation.Severity
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        var routine = await routineService.AssignForProfileAsync(
            userId,
            command.Goal,
            command.Level,
            command.DaysPerWeek,
            cancellationToken);

        user = await db.Users
            .AsNoTracking()
            .Include(item => item.Limitations)
            .SingleAsync(item => item.Id == userId, cancellationToken);

        return new OnboardingResult(ResultMappings.User(user), routine);
    }

    private static void Validate(OnboardingCommand command)
    {
        var errors = new List<string>();
        if (command.DaysPerWeek is < 2 or > 6)
            errors.Add("DaysPerWeek must be between 2 and 6.");
        if (command.SessionMin is not (30 or 45 or 60))
            errors.Add("SessionMin must be 30, 45 or 60.");
        if (command.Age is < 13 or > 100)
            errors.Add("Age must be between 13 and 100.");

        if (errors.Count > 0)
            throw new ServiceValidationException(errors);
    }
}
