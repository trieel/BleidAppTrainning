using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Application.Contracts;

public sealed record ExerciseResult(
    Guid Id,
    Guid MuscleGroupId,
    string MuscleGroupName,
    string Name,
    string Description,
    EquipmentType Equipment,
    LevelType Level,
    IReadOnlyCollection<string> Contraindications,
    string? ModificationTip,
    string? ImageUrl,
    bool IsContraindicated);

public sealed record MuscleGroupResult(Guid Id, string Name, string? Icon);
