using BleidAppTraining.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace BleidAppTraining.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int? Age { get; set; }
    public SexType? Sex { get; set; }
    public GoalType? Goal { get; set; }
    public LevelType? Level { get; set; }
    public int? DaysPerWeek { get; set; }
    public int? SessionMin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserLimitation> Limitations { get; set; } = new List<UserLimitation>();
    public ICollection<Routine> CreatedRoutines { get; set; } = new List<Routine>();
    public ICollection<UserRoutine> Routines { get; set; } = new List<UserRoutine>();
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = new List<WorkoutSession>();
}
