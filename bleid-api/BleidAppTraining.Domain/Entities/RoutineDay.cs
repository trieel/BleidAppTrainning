namespace BleidAppTraining.Domain.Entities;

public class RoutineDay
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoutineId { get; set; }
    public int DayNumber { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }

    public Routine Routine { get; set; } = null!;
    public ICollection<RoutineExercise> Exercises { get; set; } = new List<RoutineExercise>();
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = new List<WorkoutSession>();
}
