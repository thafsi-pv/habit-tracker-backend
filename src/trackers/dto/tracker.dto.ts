import { IsString, MaxLength, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateTrackerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

export class UpdateTrackerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  notifyOnActivityUpdate?: boolean;
}
