import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { HabitSubtasksService } from './habit-subtasks.service';
import { CreateSubtaskBodyDto, UpdateSubtaskDto } from './dto/subtask.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class HabitSubtasksController {
  constructor(private subtasksService: HabitSubtasksService) {}

  @Post('habits/:habitId/subtasks')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('habitId') habitId: string,
    @Body() dto: CreateSubtaskBodyDto,
  ) {
    return this.subtasksService.create(user.userId, { ...dto, habitId });
  }

  @Patch('subtasks/:subtaskId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.subtasksService.update(user.userId, subtaskId, dto);
  }

  @Delete('subtasks/:subtaskId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('subtaskId') subtaskId: string) {
    return this.subtasksService.remove(user.userId, subtaskId);
  }
}
