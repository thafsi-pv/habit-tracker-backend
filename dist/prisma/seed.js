"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
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
                    { userId: thafsi.id, role: client_1.TrackerRole.MASTER },
                    { userId: naju.id, role: client_1.TrackerRole.MEMBER },
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
    console.log('Seed complete. Dev accounts:');
    console.log(`  thafsi@example.com / ${DEV_PASSWORD} (MASTER)`);
    console.log(`  naju@example.com / ${DEV_PASSWORD} (MEMBER)`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map