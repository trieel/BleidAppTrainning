using BleidAppTraining.Application.Contracts;
using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Application.Interfaces;

public interface IRoutineService
{
    Task<RoutineResult> GetActiveAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<RoutineResult> AssignForProfileAsync(Guid userId, GoalType goal, LevelType level, int daysPerWeek, CancellationToken cancellationToken = default);
    Task<RoutineResult> CustomizeAsync(Guid userId, CustomizeRoutineCommand command, CancellationToken cancellationToken = default);
    Task<RoutineResult> AddDayAsync(Guid userId, Guid routineId, AddRoutineDayCommand command, CancellationToken cancellationToken = default);
    Task<RoutineResult> DeleteDayAsync(Guid userId, Guid routineId, Guid dayId, CancellationToken cancellationToken = default);
    Task<RoutineResult> UpdateDayAsync(Guid userId, Guid routineId, Guid dayId, UpdateRoutineDayCommand command, CancellationToken cancellationToken = default);
    Task<RoutineResult> AddExerciseAsync(Guid userId, Guid routineId, Guid dayId, AddRoutineExerciseCommand command, CancellationToken cancellationToken = default);
    Task<RoutineResult> RemoveExerciseAsync(Guid userId, Guid routineId, Guid dayId, Guid exerciseId, CancellationToken cancellationToken = default);
}
