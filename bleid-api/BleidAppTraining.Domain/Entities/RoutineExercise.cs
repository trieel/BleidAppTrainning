namespace BleidAppTraining.Domain.Entities;

public class RoutineExercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoutineDayId { get; set; }
    public Guid ExerciseId { get; set; }
    public int Sets { get; set; }
    public int RepsMin { get; set; }
    public int RepsMax { get; set; }
    public int RestSeconds { get; set; }
    public int Order { get; set; }

    public RoutineDay RoutineDay { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
}
