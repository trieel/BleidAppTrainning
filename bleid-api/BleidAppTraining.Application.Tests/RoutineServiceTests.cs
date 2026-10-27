using BleidAppTraining.Application.Common;
using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class RoutineServiceTests
{
    private static async Task<(BleidAppTraining.Infrastructure.Persistence.BleidDbContext db, Guid userId, Routine template)> SeedTemplatesAsync(string dbName)
    {
        var db = TestDbContextFactory.Create(dbName);
        var userId = Guid.NewGuid();

        var muscleGroup = new MuscleGroup { Id = Guid.NewGuid(), Name = "Pecho", Icon = "chest" };
        var safeExercise = new Exercise
        {
            Id = Guid.NewGuid(),
            MuscleGroupId = muscleGroup.Id,
            MuscleGroup = muscleGroup,
            Name = "Press de pecho en maquina",
            Equipment = EquipmentType.Machine,
            Level = LevelType.Beginner,
            Contraindications = []
        };
        var riskyExercise = new Exercise
        {
            Id = Guid.NewGuid(),
            MuscleGroupId = muscleGroup.Id,
            MuscleGroup = muscleGroup,
            Name = "Press inclinado pesado",
            Equipment = EquipmentType.Barbell,
            Level = LevelType.Intermediate,
            Contraindications = ["Shoulder"]
        };

        db.MuscleGroups.Add(muscleGroup);
        db.Exercises.AddRange(safeExercise, riskyExercise);

        var template = new Routine
        {
            Id = Guid.NewGuid(),
            Name = "Template Hipertrofia 3d",
            Goal = GoalType.GainMuscle,
            Level = LevelType.Beginner,
            DaysPerWeek = 3,
            IsTemplate = true
        };

        var day = new RoutineDay
        {
            Id = Guid.NewGuid(),
            DayNumber = 1,
            Name = "Día 1",
            Order = 1
        };

        day.Exercises.Add(new RoutineExercise
        {
            ExerciseId = riskyExercise.Id,
            Exercise = riskyExercise,
            Sets = 3,
            RepsMin = 8,
            RepsMax = 12,
            RestSeconds = 90,
            Order = 1
        });

        template.Days.Add(day);
        db.Routines.Add(template);

        await db.SaveChangesAsync();
        return (db, userId, template);
    }

    [Fact]
    public async Task AssignForProfileAsync_ExactMatch_AssignsClonedRoutine()
    {
        var (db, userId, template) = await SeedTemplatesAsync(nameof(AssignForProfileAsync_ExactMatch_AssignsClonedRoutine));
        using (db)
        {
            var service = new RoutineService(db);
            var result = await service.AssignForProfileAsync(userId, GoalType.GainMuscle, LevelType.Beginner, 3);

            Assert.NotNull(result);
            Assert.False(result.IsTemplate);
            Assert.Equal(template.Name, result.Name);
            Assert.Single(result.Days);
        }
    }

    [Fact]
    public async Task AssignForProfileAsync_NonExactDays_PicksBestScoringTemplate()
    {
        var (db, userId, template) = await SeedTemplatesAsync(nameof(AssignForProfileAsync_NonExactDays_PicksBestScoringTemplate));
        using (db)
        {
            var service = new RoutineService(db);
            // User requested 4 days, but template is 3 days
            var result = await service.AssignForProfileAsync(userId, GoalType.GainMuscle, LevelType.Beginner, 4);

            Assert.NotNull(result);
            Assert.Equal(template.Name, result.Name);
        }
    }

    [Fact]
    public async Task AssignForProfileAsync_ReplacesContraindicatedExerciseWithSafeAlternative()
    {
        var (db, userId, _) = await SeedTemplatesAsync(nameof(AssignForProfileAsync_ReplacesContraindicatedExerciseWithSafeAlternative));
        using (db)
        {
            // User has Shoulder limitation
            db.UserLimitations.Add(new UserLimitation
            {
                UserId = userId,
                Type = LimitationType.Shoulder,
                Severity = SeverityType.Moderate
            });
            await db.SaveChangesAsync();

            var service = new RoutineService(db);
            var result = await service.AssignForProfileAsync(userId, GoalType.GainMuscle, LevelType.Beginner, 3);

            var firstExercise = result.Days.First().Exercises.First();
            // Risky exercise had Shoulder contraindication; should have been replaced with safe alternative
            Assert.Equal("Press de pecho en maquina", firstExercise.ExerciseName);
        }
    }

    [Fact]
    public async Task AddDayAsync_ValidCommand_AppendsNewDayAndIncreasesDaysPerWeek()
    {
        var (db, userId, _) = await SeedTemplatesAsync(nameof(AddDayAsync_ValidCommand_AppendsNewDayAndIncreasesDaysPerWeek));
        using (db)
        {
            var service = new RoutineService(db);
            var routine = await service.AssignForProfileAsync(userId, GoalType.GainMuscle, LevelType.Beginner, 3);
            Assert.Single(routine.Days);

            var updated = await service.AddDayAsync(userId, routine.Id, new BleidAppTraining.Application.Contracts.AddRoutineDayCommand
            {
                Name = "Día 2 - Espalda y Bíceps"
            });

            Assert.Equal(2, updated.Days.Count);
            Assert.Equal(2, updated.DaysPerWeek);

            var newDay = updated.Days.Last();
            Assert.Equal(2, newDay.DayNumber);
            Assert.Equal("Día 2 - Espalda y Bíceps", newDay.Name);
        }
    }

    [Fact]
    public async Task DeleteDayAsync_MultipleDays_RemovesDayAndAdjustsCounters()
    {
        var (db, userId, _) = await SeedTemplatesAsync(nameof(DeleteDayAsync_MultipleDays_RemovesDayAndAdjustsCounters));
        using (db)
        {
            var service = new RoutineService(db);
            var routine = await service.AssignForProfileAsync(userId, GoalType.GainMuscle, LevelType.Beginner, 3);
            var updated = await service.AddDayAsync(userId, routine.Id, new BleidAppTraining.Application.Contracts.AddRoutineDayCommand
            {
                Name = "Día 2"
            });
            Assert.Equal(2, updated.Days.Count);

            var firstDayId = updated.Days.First().Id;
            var afterDelete = await service.DeleteDayAsync(userId, routine.Id, firstDayId);

            Assert.Single(afterDelete.Days);
            Assert.Equal(1, afterDelete.DaysPerWeek);
            Assert.Equal(1, afterDelete.Days.First().DayNumber);
        }
    }

    [Fact]
    public async Task DeleteDayAsync_SingleDay_ThrowsServiceValidationException()
    {
        var (db, userId, _) = await SeedTemplatesAsync(nameof(DeleteDayAsync_SingleDay_ThrowsServiceValidationException));
        using (db)
        {
            var service = new RoutineService(db);
            var routine = await service.AssignForProfileAsync(userId, GoalType.GainMuscle, LevelType.Beginner, 3);
            var dayId = routine.Days.First().Id;

            await Assert.ThrowsAsync<BleidAppTraining.Application.Common.ServiceValidationException>(() =>
                service.DeleteDayAsync(userId, routine.Id, dayId));
        }
    }

    [Fact]
    public async Task DeleteDayAsync_WhenDayHasWorkoutSessions_ThrowsServiceValidationException()
    {
        var (db, userId, _) = await SeedTemplatesAsync(nameof(DeleteDayAsync_WhenDayHasWorkoutSessions_ThrowsServiceValidationException));
        using (db)
        {
            var service = new RoutineService(db);
            var routine = await service.AssignForProfileAsync(userId, GoalType.GainMuscle, LevelType.Beginner, 3);
            var updated = await service.AddDayAsync(userId, routine.Id, new BleidAppTraining.Application.Contracts.AddRoutineDayCommand
            {
                Name = "Día 2"
            });
            var dayId = updated.Days.First().Id;
            db.WorkoutSessions.Add(new WorkoutSession { UserId = userId, RoutineDayId = dayId });
            await db.SaveChangesAsync();

            var ex = await Assert.ThrowsAsync<ServiceValidationException>(() =>
                service.DeleteDayAsync(userId, routine.Id, dayId));
            Assert.Contains(ex.Errors, e => e.Contains("sesiones de entrenamiento registradas"));
        }
    }
}
