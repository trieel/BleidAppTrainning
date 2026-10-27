using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using BleidAppTraining.Infrastructure.Persistence;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class WorkoutServiceTests
{
    private static async Task<(BleidDbContext db, Guid userId, Guid routineId, Guid dayId, Guid exerciseId)> SeedUserAndRoutineAsync(string dbName)
    {
        var db = TestDbContextFactory.Create(dbName);
        var userId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();

        var routine = new Routine
        {
            Id = routineId,
            Name = "Rutina Test",
            Goal = GoalType.GainMuscle,
            Level = LevelType.Intermediate,
            DaysPerWeek = 3,
            IsTemplate = false
        };

        var day = new RoutineDay
        {
            Id = dayId,
            RoutineId = routineId,
            DayNumber = 1,
            Name = "Día 1 - Torso",
            Order = 1
        };

        var muscleGroup = new MuscleGroup { Id = Guid.NewGuid(), Name = "Pecho", Icon = "chest" };
        var exercise = new Exercise
        {
            Id = exerciseId,
            MuscleGroupId = muscleGroup.Id,
            MuscleGroup = muscleGroup,
            Name = "Press de Banca",
            Description = "Barbell bench press",
            Equipment = EquipmentType.Barbell,
            Level = LevelType.Intermediate,
            Contraindications = []
        };

        var routineExercise = new RoutineExercise
        {
            Id = Guid.NewGuid(),
            RoutineDayId = dayId,
            ExerciseId = exerciseId,
            Exercise = exercise,
            Sets = 3,
            RepsMin = 8,
            RepsMax = 12,
            RestSeconds = 90,
            Order = 1
        };

        day.Exercises.Add(routineExercise);
        routine.Days.Add(day);

        db.MuscleGroups.Add(muscleGroup);
        db.Exercises.Add(exercise);
        db.Routines.Add(routine);
        db.RoutineDays.Add(day);
        db.RoutineExercises.Add(routineExercise);

        db.UserRoutines.Add(new UserRoutine
        {
            UserId = userId,
            RoutineId = routineId,
            IsActive = true
        });

        await db.SaveChangesAsync();
        return (db, userId, routineId, dayId, exerciseId);
    }

    [Fact]
    public async Task StartSessionAsync_CreatesNewSession()
    {
        var (db, userId, _, dayId, _) = await SeedUserAndRoutineAsync(nameof(StartSessionAsync_CreatesNewSession));
        using (db)
        {
            var service = new WorkoutService(db);
            var result = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });

            Assert.NotNull(result);
            Assert.Equal(dayId, result.RoutineDayId);
            Assert.Null(result.FinishedAt);
        }
    }

    [Fact]
    public async Task StartSessionAsync_WhenPriorSessionUnfinishedForDifferentDay_ClosesPriorSession()
    {
        var (db, userId, routineId, day1Id, _) = await SeedUserAndRoutineAsync(nameof(StartSessionAsync_WhenPriorSessionUnfinishedForDifferentDay_ClosesPriorSession));
        var day2Id = Guid.NewGuid();
        var day2 = new RoutineDay
        {
            Id = day2Id,
            RoutineId = routineId,
            DayNumber = 2,
            Name = "Día 2 - Pierna",
            Order = 2
        };
        db.RoutineDays.Add(day2);

        var priorSession = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RoutineDayId = day1Id,
            StartedAt = DateTime.UtcNow.AddDays(-1)
        };
        db.WorkoutSessions.Add(priorSession);
        await db.SaveChangesAsync();

        using (db)
        {
            var service = new WorkoutService(db);
            var newSession = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = day2Id });

            Assert.Equal(day2Id, newSession.RoutineDayId);
            var oldSessionInDb = await db.WorkoutSessions.FindAsync(priorSession.Id);
            Assert.NotNull(oldSessionInDb);
            Assert.NotNull(oldSessionInDb.FinishedAt);
        }
    }

    [Fact]
    public async Task StartSessionAsync_WhenPriorSessionForSameDay_ReturnsExistingSessionWithoutClosingIt()
    {
        var (db, userId, _, dayId, _) = await SeedUserAndRoutineAsync(nameof(StartSessionAsync_WhenPriorSessionForSameDay_ReturnsExistingSessionWithoutClosingIt));
        using (db)
        {
            var service = new WorkoutService(db);
            var initialSession = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });
            var resumedSession = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });

            Assert.Equal(initialSession.Id, resumedSession.Id);
            Assert.Null(resumedSession.FinishedAt);
        }
    }

    [Fact]
    public async Task GetActiveSessionAsync_ReturnsExistingActiveSession()
    {
        var (db, userId, _, dayId, _) = await SeedUserAndRoutineAsync(nameof(GetActiveSessionAsync_ReturnsExistingActiveSession));
        using (db)
        {
            var service = new WorkoutService(db);
            var started = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });

            var active = await service.GetActiveSessionAsync(userId);

            Assert.NotNull(active);
            Assert.Equal(started.Id, active.Id);
        }
    }

    [Fact]
    public async Task RegisterSetAsync_AddsSetToSession()
    {
        var (db, userId, _, dayId, exerciseId) = await SeedUserAndRoutineAsync(nameof(RegisterSetAsync_AddsSetToSession));
        using (db)
        {
            var service = new WorkoutService(db);
            var session = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });

            var updated = await service.RegisterSetAsync(userId, session.Id, new RegisterSetCommand
            {
                ExerciseId = exerciseId,
                SetNumber = 1,
                Reps = 10,
                WeightKg = 70,
                Completed = true
            });

            Assert.Single(updated.Sets);
            Assert.Equal(70, updated.Sets.First().WeightKg);
            Assert.Equal(10, updated.Sets.First().Reps);
        }
    }

    [Fact]
    public async Task RegisterSetAsync_DuplicateSetNumber_ThrowsValidationException()
    {
        var (db, userId, _, dayId, exerciseId) = await SeedUserAndRoutineAsync(nameof(RegisterSetAsync_DuplicateSetNumber_ThrowsValidationException));
        using (db)
        {
            var service = new WorkoutService(db);
            var session = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });

            await service.RegisterSetAsync(userId, session.Id, new RegisterSetCommand
            {
                ExerciseId = exerciseId,
                SetNumber = 1,
                Reps = 10,
                WeightKg = 70,
                Completed = true
            });

            await Assert.ThrowsAsync<ServiceValidationException>(() =>
                service.RegisterSetAsync(userId, session.Id, new RegisterSetCommand
                {
                    ExerciseId = exerciseId,
                    SetNumber = 1,
                    Reps = 10,
                    WeightKg = 70,
                    Completed = true
                }));
        }
    }

    [Fact]
    public async Task EndSessionAsync_MarksFinishedAndSavesNotes()
    {
        var (db, userId, _, dayId, _) = await SeedUserAndRoutineAsync(nameof(EndSessionAsync_MarksFinishedAndSavesNotes));
        using (db)
        {
            var service = new WorkoutService(db);
            var session = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });

            var ended = await service.EndSessionAsync(userId, session.Id, new EndSessionCommand
            {
                Notes = "Buen entrenamiento"
            });

            Assert.NotNull(ended.FinishedAt);
            Assert.Equal("Buen entrenamiento", ended.Notes);

            var active = await service.GetActiveSessionAsync(userId);
            Assert.Null(active);
        }
    }

    [Fact]
    public async Task DeleteSetAsync_RemovesSetAndRenumbersRemainingSets()
    {
        var (db, userId, _, dayId, exerciseId) = await SeedUserAndRoutineAsync(nameof(DeleteSetAsync_RemovesSetAndRenumbersRemainingSets));
        using (db)
        {
            var service = new WorkoutService(db);
            var session = await service.StartSessionAsync(userId, new StartSessionCommand { RoutineDayId = dayId });

            var after1 = await service.RegisterSetAsync(userId, session.Id, new RegisterSetCommand
            {
                ExerciseId = exerciseId,
                SetNumber = 1,
                Reps = 10,
                WeightKg = 60,
                Completed = true
            });

            var after2 = await service.RegisterSetAsync(userId, session.Id, new RegisterSetCommand
            {
                ExerciseId = exerciseId,
                SetNumber = 2,
                Reps = 8,
                WeightKg = 65,
                Completed = true
            });

            Assert.Equal(2, after2.Sets.Count);

            var firstSetId = after2.Sets.First(s => s.SetNumber == 1).Id;
            var afterDelete = await service.DeleteSetAsync(userId, session.Id, firstSetId);

            Assert.Single(afterDelete.Sets);
            // The remaining set should now be re-numbered to 1
            Assert.Equal(1, afterDelete.Sets.First().SetNumber);
            Assert.Equal(65, afterDelete.Sets.First().WeightKg);
        }
    }
}
