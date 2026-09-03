import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'notificationTime must be HH:mm (24h)' })
  notificationTime?: string;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}
