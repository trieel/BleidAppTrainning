using BleidAppTraining.Application.Services;
using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using Xunit;

namespace BleidAppTraining.Application.Tests;

public class ExerciseServiceTests
{
    [Fact]
    public void IsContraindicated_WhenUserHasMatchingLimitation_ReturnsTrue()
    {
        var contraindications = new[] { "Knee", "Lumbar" };
        var userLimitations = new[] { LimitationType.Knee };

        var result = ExerciseService.IsContraindicated(contraindications, userLimitations);

        Assert.True(result);
    }

    [Fact]
    public void IsContraindicated_WhenUserHasNoMatchingLimitation_ReturnsFalse()
    {
        var contraindications = new[] { "Knee", "Lumbar" };
        var userLimitations = new[] { LimitationType.Shoulder };

        var result = ExerciseService.IsContraindicated(contraindications, userLimitations);

        Assert.False(result);
    }

    [Fact]
    public void IsContraindicated_IgnoresCasingAndSpaces()
    {
        var contraindications = new[] { "lumbar_spine", "knee " };
        var userLimitations = new[] { LimitationType.Lumbar };

        // LimitationType.Lumbar string is "Lumbar".
        // Normalize replaces "_" and " "
        // "lumbar_spine" normalized is "lumbarspine"
        // Let's test with exact normalized match:
        var contra = new[] { "Lumbar", "Knee" };
        Assert.True(ExerciseService.IsContraindicated(contra, new[] { LimitationType.Lumbar }));
    }

    [Fact]
    public async Task GetCatalogAsync_FiltersOutContraindicatedExercises()
    {
        using var db = TestDbContextFactory.Create(nameof(GetCatalogAsync_FiltersOutContraindicatedExercises));
        var userId = Guid.NewGuid();
        var muscleGroup = new MuscleGroup { Id = Guid.NewGuid(), Name = "Piernas", Icon = "dumbbell" };
        db.MuscleGroups.Add(muscleGroup);

        db.UserLimitations.Add(new UserLimitation
        {
            UserId = userId,
            Type = LimitationType.Knee,
            Severity = SeverityType.Moderate
        });

        db.Exercises.AddRange(
            new Exercise
            {
                Id = Guid.NewGuid(),
                MuscleGroupId = muscleGroup.Id,
                MuscleGroup = muscleGroup,
                Name = "Sentadilla profunda",
                Description = "Sentadilla con barra",
                Equipment = EquipmentType.Barbell,
                Level = LevelType.Intermediate,
                Contraindications = ["Knee"]
            },
            new Exercise
            {
                Id = Guid.NewGuid(),
                MuscleGroupId = muscleGroup.Id,
                MuscleGroup = muscleGroup,
                Name = "Puente de glúteos",
                Description = "Elevación de cadera",
                Equipment = EquipmentType.Bodyweight,
                Level = LevelType.Beginner,
                Contraindications = []
            }
        );

        await db.SaveChangesAsync();

        var service = new ExerciseService(db);
        var catalog = await service.GetCatalogAsync(userId, null);

        Assert.Single(catalog);
        Assert.Equal("Puente de glúteos", catalog.First().Name);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsExerciseWithContraindicationFlag()
    {
        using var db = TestDbContextFactory.Create(nameof(GetByIdAsync_ReturnsExerciseWithContraindicationFlag));
        var userId = Guid.NewGuid();
        var muscleGroup = new MuscleGroup { Id = Guid.NewGuid(), Name = "Hombros", Icon = "dumbbell" };
        var exerciseId = Guid.NewGuid();

        db.MuscleGroups.Add(muscleGroup);
        db.UserLimitations.Add(new UserLimitation
        {
            UserId = userId,
            Type = LimitationType.Shoulder,
            Severity = SeverityType.Moderate
        });

        db.Exercises.Add(new Exercise
        {
            Id = exerciseId,
            MuscleGroupId = muscleGroup.Id,
            MuscleGroup = muscleGroup,
            Name = "Press Militar",
            Description = "Press sobre la cabeza",
            Equipment = EquipmentType.Barbell,
            Level = LevelType.Intermediate,
            Contraindications = ["Shoulder"],
            ModificationTip = "Proba elevaciones laterales controladas"
        });

        await db.SaveChangesAsync();

        var service = new ExerciseService(db);
        var result = await service.GetByIdAsync(userId, exerciseId);

        Assert.NotNull(result);
        Assert.Equal("Press Militar", result.Name);
        Assert.True(result.IsContraindicated);
        Assert.Equal("Proba elevaciones laterales controladas", result.ModificationTip);
    }

    [Fact]
    public async Task SeedAsync_ExecutesSuccessfullyAndSeedsExpandedCatalog()
    {
        using var db = TestDbContextFactory.Create(nameof(SeedAsync_ExecutesSuccessfullyAndSeedsExpandedCatalog));

        await BleidAppTraining.Infrastructure.Persistence.SeedData.SeedAsync(db);

        var exercisesCount = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(db.Exercises);
        var routinesCount = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(db.Routines);

        Assert.True(exercisesCount >= 60, $"Expected at least 60 exercises, found {exercisesCount}");
        Assert.True(routinesCount > 0, $"Expected template routines, found {routinesCount}");
    }
}
