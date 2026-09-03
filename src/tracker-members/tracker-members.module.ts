import { Module } from '@nestjs/common';
import { TrackerMembersController } from './tracker-members.controller';
import { TrackerMembersService } from './tracker-members.service';

@Module({
  controllers: [TrackerMembersController],
  providers: [TrackerMembersService],
})
export class TrackerMembersModule {}
