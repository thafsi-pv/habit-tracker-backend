interface HabitLike {
  id: string;
  subtasks: { id: string }[];
}

/**
 * Resolves whether a habit counts as "completed" for a user on a given day.
 * - No subtasks: driven directly by the DailyHabit.completed flag.
 * - Has subtasks: completed only once every active subtask is completed
 *   that day (the DailyHabit row itself is not the source of truth then).
 */
export function isHabitCompleteForUser(
  habit: HabitLike,
  habitCompletedSet: Set<string>, // set of habitIds the user completed directly
  subtaskCompletedSet: Set<string>, // set of subtaskIds the user completed
): boolean {
  if (habit.subtasks.length === 0) {
    return habitCompletedSet.has(habit.id);
  }
  return habit.subtasks.every((s) => subtaskCompletedSet.has(s.id));
}

export function buildCompletedSets(
  habitCompletions: { habitId: string; userId: string; completed: boolean }[],
  subtaskCompletions: { subtaskId: string; userId: string; completed: boolean }[],
  userId: string,
) {
  const habitCompletedSet = new Set(
    habitCompletions.filter((c) => c.userId === userId && c.completed).map((c) => c.habitId),
  );
  const subtaskCompletedSet = new Set(
    subtaskCompletions.filter((c) => c.userId === userId && c.completed).map((c) => c.subtaskId),
  );
  return { habitCompletedSet, subtaskCompletedSet };
}
