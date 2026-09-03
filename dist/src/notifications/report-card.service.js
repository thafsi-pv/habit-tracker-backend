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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ReportCardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCardService = void 0;
const common_1 = require("@nestjs/common");
const satori_1 = __importDefault(require("satori"));
const resvg_js_1 = require("@resvg/resvg-js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ReportCardService = ReportCardService_1 = class ReportCardService {
    constructor() {
        this.logger = new common_1.Logger(ReportCardService_1.name);
        this.fontPath = path.join(process.cwd(), 'assets', 'NotoSans-Regular.ttf');
        this.cachedFont = null;
    }
    getFont() {
        if (!this.cachedFont) {
            this.cachedFont = fs.readFileSync(this.fontPath);
        }
        return this.cachedFont;
    }
    async render(params) {
        const height = this.estimateHeight(params);
        const svg = await (0, satori_1.default)(this.buildJsx(params), {
            width: 720,
            height,
            fonts: [
                { name: 'Noto Sans', data: this.getFont(), weight: 400, style: 'normal' },
            ],
        });
        const png = new resvg_js_1.Resvg(svg, { fitTo: { mode: 'width', value: 720 } }).render().asPng();
        return png;
    }
    estimateHeight(p) {
        const headerAndFooter = 320;
        const memberBase = 210;
        const habitRow = 62;
        const padding = 64;
        const totalHabits = p.currentUser.habits.length + p.otherMembers.reduce((s, m) => s + m.habits.length, 0);
        const totalMembers = 1 + p.otherMembers.length;
        const memberHeight = totalMembers * memberBase + totalHabits * habitRow;
        return Math.max(1024, padding + headerAndFooter + memberHeight);
    }
    buildJsx(p) {
        const COLORS = {
            bg: '#0f172a',
            card: '#1e293b',
            accent: '#22d3ee',
            text: '#f1f5f9',
            muted: '#94a3b8',
            done: '#10b981',
            pending: '#ef4444',
            border: '#334155',
        };
        const ICON = {
            header: '🌙',
            tracker: '📌',
            date: '📅',
            wave: '👋',
            master: '👑',
            user: '👤',
            summary: '📈',
            done: '✅',
            notDone: '❌',
            perfect: '🎉',
            streak: '🔥',
            groupWin: '🎉🎉',
            great: '💪',
            push: '🔥',
            default: '•',
        };
        const h = (type, props = {}, ...children) => {
            const cleaned = children.filter((c) => c !== null && c !== undefined && c !== false);
            const next = { ...props };
            if (cleaned.length === 0) {
            }
            else if (cleaned.length === 1) {
                next.children = cleaned[0];
            }
            else {
                next.children = cleaned;
            }
            return { type, props: next };
        };
        const progressBar = (percent, color) => {
            const filled = Math.max(0, Math.min(10, Math.round(percent / 10)));
            const empty = 10 - filled;
            const segments = [];
            for (let i = 0; i < filled; i++) {
                segments.push(h('div', { style: { flex: 1, height: '100%', background: color } }));
            }
            for (let i = 0; i < empty; i++) {
                segments.push(h('div', { style: { flex: 1, height: '100%', background: '#334155' } }));
            }
            return h('div', { style: { display: 'flex', width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 } }, ...segments);
        };
        const habitRow = (habit) => {
            const statusColor = habit.completed ? COLORS.done : COLORS.pending;
            const statusIcon = habit.completed ? ICON.done : ICON.notDone;
            return h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: '#0f172a',
                    borderRadius: 8,
                    marginBottom: 8,
                    border: `1px solid ${COLORS.border}`,
                },
            }, h('div', { style: { fontSize: 20, marginRight: 10, color: COLORS.muted, fontWeight: 700 } }, habit.icon ?? ICON.default), h('div', { style: { flex: 1, fontSize: 18, color: COLORS.text, fontWeight: 500 } }, habit.name), habit.streak > 0
                ? h('div', { style: { fontSize: 14, color: '#fb923c', marginRight: 10, fontWeight: 600 } }, `${ICON.streak}${habit.streak}`)
                : null, h('div', {
                style: {
                    minWidth: 32,
                    height: 28,
                    padding: '0 8px',
                    borderRadius: 14,
                    background: statusColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                },
            }, statusIcon));
        };
        const memberCard = (m) => {
            const accentColor = m.isCurrentUser ? COLORS.accent : '#a78bfa';
            const crown = m.isMaster ? ` ${ICON.master}` : '';
            return h('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    background: COLORS.card,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    border: `2px solid ${m.isCurrentUser ? COLORS.accent : COLORS.border}`,
                },
            }, h('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                },
            }, h('div', { style: { fontSize: 22, fontWeight: 700, color: COLORS.text } }, `${m.name}${crown}`), h('div', {
                style: {
                    fontSize: 20,
                    fontWeight: 700,
                    color: accentColor,
                },
            }, `${m.percent}%`)), progressBar(m.percent, accentColor), h('div', { style: { height: 12 } }), ...m.habits.map((habit) => habitRow(habit)), h('div', { style: { fontSize: 14, color: COLORS.muted, marginTop: 4 } }, `${m.completed}/${m.total} completed${m.percent === 100 ? `  ${ICON.perfect}` : ''}`));
        };
        const allMembers = [p.currentUser, ...p.otherMembers];
        const totalCompleted = allMembers.reduce((s, m) => s + m.completed, 0);
        const totalHabits = allMembers.reduce((s, m) => s + m.total, 0);
        const overallPercent = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;
        return h('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                background: COLORS.bg,
                padding: 32,
                fontFamily: 'Noto Sans',
            },
        }, h('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                marginBottom: 20,
            },
        }, h('div', {
            style: {
                fontSize: 32,
                fontWeight: 800,
                color: COLORS.text,
                marginBottom: 6,
            },
        }, `${ICON.header} Daily Habit Report`), h('div', { style: { fontSize: 18, color: COLORS.muted, marginBottom: 2 } }, `${ICON.tracker} ${p.trackerName}`), h('div', { style: { fontSize: 16, color: COLORS.muted } }, `${ICON.date} ${p.dateLabel}`), h('div', { style: { fontSize: 18, color: COLORS.accent, marginTop: 10 } }, `Hey ${p.userName}, ${ICON.wave}`)), memberCard(p.currentUser), ...p.otherMembers.map((m) => memberCard(m)), h('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                background: '#0b1220',
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
                border: `1px solid ${COLORS.border}`,
            },
        }, h('div', {
            style: {
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.text,
                marginBottom: 8,
            },
        }, `${ICON.summary} Group Summary`), h('div', { style: { fontSize: 16, color: COLORS.muted, marginBottom: 4 } }, `Total: ${totalCompleted}/${totalHabits} (${overallPercent}%)`), h('div', { style: { fontSize: 18, color: COLORS.accent, fontWeight: 600 } }, overallPercent === 100
            ? `${ICON.groupWin} Everyone nailed it today!`
            : overallPercent >= 75
                ? `${ICON.great} Great teamwork!`
                : `${ICON.push} Let's push harder tomorrow!`)));
    }
};
exports.ReportCardService = ReportCardService;
exports.ReportCardService = ReportCardService = ReportCardService_1 = __decorate([
    (0, common_1.Injectable)()
], ReportCardService);
//# sourceMappingURL=report-card.service.js.map