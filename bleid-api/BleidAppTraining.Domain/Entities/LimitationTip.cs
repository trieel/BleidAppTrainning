using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Domain.Entities;

public class LimitationTip
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public LimitationType LimitationType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public TipType TipType { get; set; }
}
