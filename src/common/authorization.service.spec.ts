import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { AuthorizationService } from './authorization.service';

function makePrismaMock() {
  return {
    trackerMember: { findUnique: jest.fn() },
    habit: { findUnique: jest.fn() },
    habitSubtask: { findUnique: jest.fn() },
  } as any;
}

describe('AuthorizationService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let authz: AuthorizationService;

  beforeEach(() => {
    prisma = makePrismaMock();
    authz = new AuthorizationService(prisma);
  });

  it('throws ForbiddenException when the user is not a tracker member', async () => {
    prisma.trackerMember.findUnique.mockResolvedValue(null);
    await expect(authz.getMembership('user-a', 'tracker-1')).rejects.toThrow(ForbiddenException);
  });

  it('returns membership when the user belongs to the tracker', async () => {
    prisma.trackerMember.findUnique.mockResolvedValue({ role: TrackerRole.MEMBER });
    await expect(authz.getMembership('user-a', 'tracker-1')).resolves.toEqual({
      role: TrackerRole.MEMBER,
    });
  });

  it('rejects a MEMBER attempting a master-only action (e.g. create habit)', async () => {
    prisma.trackerMember.findUnique.mockResolvedValue({ role: TrackerRole.MEMBER });
    await expect(authz.requireMaster('user-a', 'tracker-1')).rejects.toThrow(ForbiddenException);
  });

  it('allows a MASTER to perform a master-only action', async () => {
    prisma.trackerMember.findUnique.mockResolvedValue({ role: TrackerRole.MASTER });
    await expect(authz.requireMaster('user-a', 'tracker-1')).resolves.toEqual({
      role: TrackerRole.MASTER,
    });
  });

  it('resolves a habit\'s tracker and rejects non-members from touching it', async () => {
    prisma.habit.findUnique.mockResolvedValue({ id: 'habit-1', trackerId: 'tracker-1' });
    prisma.trackerMember.findUnique.mockResolvedValue(null);
    await expect(authz.requireHabitAccess('user-b', 'habit-1')).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException for a habit that does not exist, not a 403 that leaks existence', async () => {
    prisma.habit.findUnique.mockResolvedValue(null);
    await expect(authz.requireHabitAccess('user-a', 'missing-habit')).rejects.toThrow(NotFoundException);
  });
});
