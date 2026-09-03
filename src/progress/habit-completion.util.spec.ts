import { buildCompletedSets, isHabitCompleteForUser } from './habit-completion.util';

describe('isHabitCompleteForUser', () => {
  it('uses the DailyHabit flag directly when the habit has no subtasks', () => {
    const habit = { id: 'h1', subtasks: [] };
    expect(isHabitCompleteForUser(habit, new Set(['h1']), new Set())).toBe(true);
    expect(isHabitCompleteForUser(habit, new Set(), new Set())).toBe(false);
  });

  it('requires ALL subtasks completed for a habit with subtasks', () => {
    const habit = { id: 'h1', subtasks: [{ id: 's1' }, { id: 's2' }] };
    expect(isHabitCompleteForUser(habit, new Set(), new Set(['s1']))).toBe(false);
    expect(isHabitCompleteForUser(habit, new Set(), new Set(['s1', 's2']))).toBe(true);
  });
});

describe('buildCompletedSets', () => {
  it('only includes completions belonging to the requested user', () => {
    const habitCompletions = [
      { habitId: 'h1', userId: 'user-a', completed: true },
      { habitId: 'h2', userId: 'user-b', completed: true },
    ];
    const { habitCompletedSet } = buildCompletedSets(habitCompletions, [], 'user-a');
    expect(habitCompletedSet.has('h1')).toBe(true);
    expect(habitCompletedSet.has('h2')).toBe(false);
  });

  it('excludes rows marked completed: false', () => {
    const habitCompletions = [{ habitId: 'h1', userId: 'user-a', completed: false }];
    const { habitCompletedSet } = buildCompletedSets(habitCompletions, [], 'user-a');
    expect(habitCompletedSet.has('h1')).toBe(false);
  });
});
