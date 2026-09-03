import { IsBoolean, IsDateString } from 'class-validator';

export class SetCompletionDto {
  @IsDateString()
  date!: string; // YYYY-MM-DD, interpreted in the user's timezone by the caller

  @IsBoolean()
  completed!: boolean;
}
