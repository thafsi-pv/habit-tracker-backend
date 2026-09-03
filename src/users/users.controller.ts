import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Patch('settings')
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserSettingsDto) {
    return this.usersService.updateSettings(user.userId, dto);
  }
}
