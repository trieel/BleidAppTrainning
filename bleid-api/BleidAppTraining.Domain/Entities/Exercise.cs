using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Domain.Entities;

public class Exercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MuscleGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public EquipmentType Equipment { get; set; }
    public LevelType Level { get; set; }
    public List<string> Contraindications { get; set; } = new();
    public string? ModificationTip { get; set; }
    public string? ImageUrl { get; set; }

    public MuscleGroup MuscleGroup { get; set; } = null!;
    public ICollection<RoutineExercise> RoutineExercises { get; set; } = new List<RoutineExercise>();
    public ICollection<WorkoutSet> WorkoutSets { get; set; } = new List<WorkoutSet>();
}
