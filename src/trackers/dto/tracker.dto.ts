import { IsString, MaxLength, MinLength } from 'class-validator';

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
  name!: string;
}
