export declare class CreateHabitDto {
    trackerId: string;
    name: string;
    icon?: string;
    sortOrder?: number;
}
export declare class UpdateHabitDto {
    name?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
}
