import { PrismaClient, TrackerRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Development-only credentials. Do NOT reuse in production.
const DEV_PASSWORD = 'password123';

async function main() {
  const passwordHash = await argon2.hash(DEV_PASSWORD);

  const thafsi = await prisma.user.upsert({
    where: { email: 'thafsi@example.com' },
    update: {},
    create: {
      name: 'Thafsi',
      email: 'thafsi@example.com',
      passwordHash,
      timezone: 'Asia/Kolkata',
      notificationTime: '20:00',
    },
  });

  const naju = await prisma.user.upsert({
    where: { email: 'naju@example.com' },
    update: {},
    create: {
      name: 'Naju',
      email: 'naju@example.com',
      passwordHash,
      timezone: 'Asia/Kolkata',
      notificationTime: '20:00',
    },
  });

  const tracker = await prisma.tracker.upsert({
    where: { id: 'seed-morning-routine' },
    update: {},
    create: {
      id: 'seed-morning-routine',
      name: 'Morning Routine',
      ownerId: thafsi.id,
      members: {
        create: [
          { userId: thafsi.id, role: TrackerRole.MASTER },
          { userId: naju.id, role: TrackerRole.MEMBER },
        ],
      },
    },
  });

  const habitsData = [
    { name: 'Prayer', icon: '🙏', subtasks: ['Morning Prayer', 'Afternoon Prayer', 'Evening Prayer', 'Night Prayer'] },
    { name: 'Exercise', icon: '🏃', subtasks: ['Push-ups', 'Squats', 'Walking'] },
    { name: 'Meditation', icon: '🧘', subtasks: [] },
    { name: 'Practice English', icon: '🗣️', subtasks: [] },
    { name: 'Read 1 page', icon: '📖', subtasks: [] },
  ];

  for (const [index, h] of habitsData.entries()) {
    const habit = await prisma.habit.create({
      data: { trackerId: tracker.id, name: h.name, icon: h.icon, sortOrder: index },
    });
    for (const [subIndex, subName] of h.subtasks.entries()) {
      await prisma.habitSubtask.create({
        data: { habitId: habit.id, name: subName, sortOrder: subIndex },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete. Dev accounts:');
  // eslint-disable-next-line no-console
  console.log(`  thafsi@example.com / ${DEV_PASSWORD} (MASTER)`);
  // eslint-disable-next-line no-console
  console.log(`  naju@example.com / ${DEV_PASSWORD} (MEMBER)`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
