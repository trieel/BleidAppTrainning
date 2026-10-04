namespace BleidAppTraining.Domain.Entities;

public class WorkoutSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid RoutineDayId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
    public RoutineDay RoutineDay { get; set; } = null!;
    public ICollection<WorkoutSet> Sets { get; set; } = new List<WorkoutSet>();
}
