using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Domain.Entities;

public class Routine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CreatedBy { get; set; }
    public string Name { get; set; } = string.Empty;
    public GoalType Goal { get; set; }
    public LevelType Level { get; set; }
    public int DaysPerWeek { get; set; }
    public bool IsTemplate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Creator { get; set; }
    public ICollection<RoutineDay> Days { get; set; } = new List<RoutineDay>();
    public ICollection<UserRoutine> UserRoutines { get; set; } = new List<UserRoutine>();
}
