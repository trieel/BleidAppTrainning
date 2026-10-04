using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Domain.Entities;

public class UserLimitation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public LimitationType Type { get; set; }
    public SeverityType Severity { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
