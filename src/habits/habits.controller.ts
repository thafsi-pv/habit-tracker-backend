import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(user.userId, dto);
  }

  @Patch(':habitId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('habitId') habitId: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(user.userId, habitId, dto);
  }

  @Delete(':habitId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('habitId') habitId: string) {
    return this.habitsService.remove(user.userId, habitId);
  }
}
