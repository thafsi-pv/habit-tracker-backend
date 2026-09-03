export declare class CreateSubtaskBodyDto {
    name: string;
    sortOrder?: number;
}
export declare class CreateSubtaskDto {
    habitId: string;
    name: string;
    sortOrder?: number;
}
export declare class UpdateSubtaskDto {
    name?: string;
    sortOrder?: number;
    isActive?: boolean;
}
