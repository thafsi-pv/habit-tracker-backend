"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const habit_completion_util_1 = require("./habit-completion.util");
describe('isHabitCompleteForUser', () => {
    it('uses the DailyHabit flag directly when the habit has no subtasks', () => {
        const habit = { id: 'h1', subtasks: [] };
        expect((0, habit_completion_util_1.isHabitCompleteForUser)(habit, new Set(['h1']), new Set())).toBe(true);
        expect((0, habit_completion_util_1.isHabitCompleteForUser)(habit, new Set(), new Set())).toBe(false);
    });
    it('requires ALL subtasks completed for a habit with subtasks', () => {
        const habit = { id: 'h1', subtasks: [{ id: 's1' }, { id: 's2' }] };
        expect((0, habit_completion_util_1.isHabitCompleteForUser)(habit, new Set(), new Set(['s1']))).toBe(false);
        expect((0, habit_completion_util_1.isHabitCompleteForUser)(habit, new Set(), new Set(['s1', 's2']))).toBe(true);
    });
});
describe('buildCompletedSets', () => {
    it('only includes completions belonging to the requested user', () => {
        const habitCompletions = [
            { habitId: 'h1', userId: 'user-a', completed: true },
            { habitId: 'h2', userId: 'user-b', completed: true },
        ];
        const { habitCompletedSet } = (0, habit_completion_util_1.buildCompletedSets)(habitCompletions, [], 'user-a');
        expect(habitCompletedSet.has('h1')).toBe(true);
        expect(habitCompletedSet.has('h2')).toBe(false);
    });
    it('excludes rows marked completed: false', () => {
        const habitCompletions = [{ habitId: 'h1', userId: 'user-a', completed: false }];
        const { habitCompletedSet } = (0, habit_completion_util_1.buildCompletedSets)(habitCompletions, [], 'user-a');
        expect(habitCompletedSet.has('h1')).toBe(false);
    });
});
//# sourceMappingURL=habit-completion.util.spec.js.map