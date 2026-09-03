import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
// import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TrackersModule } from './trackers/trackers.module';
import { TrackerMembersModule } from './tracker-members/tracker-members.module';
import { HabitsModule } from './habits/habits.module';
import { HabitSubtasksModule } from './habit-subtasks/habit-subtasks.module';
import { DailyHabitsModule } from './daily-habits/daily-habits.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProgressModule } from './progress/progress.module';
import { InvitationsModule } from './invitations/invitations.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    /*
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }], // generous global default; auth routes tighten this further
    }),
    */
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    TrackersModule,
    TrackerMembersModule,
    HabitsModule,
    HabitSubtasksModule,
    DailyHabitsModule,
    DashboardModule,
    ProgressModule,
    InvitationsModule,
    WhatsAppModule,
    NotificationsModule,
    SchedulerModule,
  ],
  providers: [/* { provide: APP_GUARD, useClass: ThrottlerGuard } */],
})
export class AppModule {}
