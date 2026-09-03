import { Global, Module, Controller } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { TrackerMemberGuard } from './guards/tracker-member.guard';
import { HealthController } from './health.controller';

@Global()
@Module({
  controllers: [HealthController],
  providers: [AuthorizationService, TrackerMemberGuard],
  exports: [AuthorizationService, TrackerMemberGuard],
})
export class CommonModule {}
