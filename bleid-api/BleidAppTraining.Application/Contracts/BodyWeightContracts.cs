namespace BleidAppTraining.Application.Contracts;

public sealed class LogBodyWeightCommand
{
    public decimal WeightKg { get; set; }
    public DateOnly? Date { get; set; }
    public string? Notes { get; set; }
}

public sealed record BodyWeightResult(
    Guid Id,
    decimal WeightKg,
    DateOnly Date,
    string? Notes,
    DateTime CreatedAt);
