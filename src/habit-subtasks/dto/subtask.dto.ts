import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Used by the controller for request body validation (habitId comes from URL param) */
export class CreateSubtaskBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

/** Used internally by the service */
export class CreateSubtaskDto {
  @IsString()
  habitId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateSubtaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
