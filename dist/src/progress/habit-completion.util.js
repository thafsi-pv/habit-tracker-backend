"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHabitCompleteForUser = isHabitCompleteForUser;
exports.buildCompletedSets = buildCompletedSets;
function isHabitCompleteForUser(habit, habitCompletedSet, subtaskCompletedSet) {
    if (habit.subtasks.length === 0) {
        return habitCompletedSet.has(habit.id);
    }
    return habit.subtasks.every((s) => subtaskCompletedSet.has(s.id));
}
function buildCompletedSets(habitCompletions, subtaskCompletions, userId) {
    const habitCompletedSet = new Set(habitCompletions.filter((c) => c.userId === userId && c.completed).map((c) => c.habitId));
    const subtaskCompletedSet = new Set(subtaskCompletions.filter((c) => c.userId === userId && c.completed).map((c) => c.subtaskId));
    return { habitCompletedSet, subtaskCompletedSet };
}
//# sourceMappingURL=habit-completion.util.js.map