export type GoalType = "LoseWeight" | "GainMuscle" | "Endurance" | "Maintain";
export type LevelType = "Beginner" | "Intermediate" | "Advanced";
export type SexType = "Male" | "Female";
export type LimitationType = "Lumbar" | "Knee" | "Shoulder" | "Wrist" | "Neck";
export type SeverityType = "Mild" | "Moderate" | "Severe";

export type UserLimitation = {
  type: LimitationType;
  severity: SeverityType;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  age: number | null;
  sex: SexType | null;
  goal: GoalType | null;
  level: LevelType | null;
  daysPerWeek: number | null;
  sessionMin: number | null;
  limitations: UserLimitation[];
};

export type AuthResult = {
  token: string;
  user: UserProfile;
};

export type Exercise = {
  id: string;
  muscleGroupId: string;
  muscleGroupName: string;
  name: string;
  description: string;
  equipment: string;
  level: LevelType;
  contraindications: string[];
  modificationTip: string | null;
  imageUrl: string | null;
  isContraindicated: boolean;
};

export type RoutineExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  order: number;
};

export type RoutineDay = {
  id: string;
  dayNumber: number;
  name: string;
  order: number;
  exercises: RoutineExercise[];
};

export type Routine = {
  id: string;
  name: string;
  goal: GoalType;
  level: LevelType;
  daysPerWeek: number;
  isTemplate: boolean;
  days: RoutineDay[];
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
  createdAt: string;
};

export type WorkoutSession = {
  id: string;
  routineDayId: string;
  routineDayName: string;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  sets: WorkoutSet[];
};

export type VolumeProgress = {
  weekStart: string;
  totalVolumeKg: number;
};

export type ExerciseProgress = {
  date: string;
  maxWeightKg: number;
  totalReps: number;
  totalVolumeKg: number;
};

export type Streak = {
  currentDays: number;
  longestDays: number;
  lastWorkoutDate: string | null;
};
