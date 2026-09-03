interface HabitLike {
    id: string;
    subtasks: {
        id: string;
    }[];
}
export declare function isHabitCompleteForUser(habit: HabitLike, habitCompletedSet: Set<string>, subtaskCompletedSet: Set<string>): boolean;
export declare function buildCompletedSets(habitCompletions: {
    habitId: string;
    userId: string;
    completed: boolean;
}[], subtaskCompletions: {
    subtaskId: string;
    userId: string;
    completed: boolean;
}[], userId: string): {
    habitCompletedSet: Set<string>;
    subtaskCompletedSet: Set<string>;
};
export {};
