import { Injectable, Logger } from '@nestjs/common';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import * as fs from 'fs';
import * as path from 'path';

interface HabitRow {
  name: string;
  icon: string | null;
  completed: boolean;
  streak: number;
}

interface MemberCardData {
  name: string;
  isMaster: boolean;
  isCurrentUser: boolean;
  habits: HabitRow[];
  completed: number;
  total: number;
  percent: number;
}

interface ReportImageParams {
  trackerName: string;
  userName: string;
  dateLabel: string;
  currentUser: MemberCardData;
  otherMembers: MemberCardData[];
}

@Injectable()
export class ReportCardService {
  private readonly logger = new Logger(ReportCardService.name);
  private readonly fontPath = path.join(process.cwd(), 'assets', 'NotoSans-Regular.ttf');
  private cachedFont: Buffer | null = null;

  private getFont(): Buffer {
    if (!this.cachedFont) {
      this.cachedFont = fs.readFileSync(this.fontPath);
    }
    return this.cachedFont;
  }

  async render(params: ReportImageParams): Promise<Buffer> {
    const height = this.estimateHeight(params);
    const svg = await satori(this.buildJsx(params) as never, {
      width: 720,
      height,
      fonts: [
        { name: 'Noto Sans', data: this.getFont(), weight: 400, style: 'normal' },
      ],
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 720 } }).render().asPng();
    return png;
  }

  private estimateHeight(p: ReportImageParams): number {
    const headerAndFooter = 320;
    const memberBase = 210;
    const habitRow = 62;
    const padding = 64;
    const totalHabits = p.currentUser.habits.length + p.otherMembers.reduce((s, m) => s + m.habits.length, 0);
    const totalMembers = 1 + p.otherMembers.length;
    const memberHeight = totalMembers * memberBase + totalHabits * habitRow;
    return Math.max(1024, padding + headerAndFooter + memberHeight);
  }

  // Satori supports a JSX-like object tree via its `jsx-runtime`. We use the
  // object form (React.createElement-style) to avoid a TSX toolchain dep.
  private buildJsx(p: ReportImageParams) {
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

    // Satori requires every <div> with multiple children to explicitly set
    // display: flex/contents/none, and treats an empty `children: []` array as
    // "multiple children" (it then complains about the missing flex). So:
    //   - filter null/false/undefined children,
    //   - omit `children` entirely when there are zero,
    //   - collapse to a single child when there's exactly one.
    const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]) => {
      const cleaned = children.filter((c) => c !== null && c !== undefined && c !== false);
      const next: Record<string, unknown> = { ...props };
      if (cleaned.length === 0) {
        // leave `children` unset
      } else if (cleaned.length === 1) {
        next.children = cleaned[0];
      } else {
        next.children = cleaned;
      }
      return { type, props: next };
    };

    const progressBar = (percent: number, color: string) => {
      const filled = Math.max(0, Math.min(10, Math.round(percent / 10)));
      const empty = 10 - filled;
      const segments: unknown[] = [];
      for (let i = 0; i < filled; i++) {
        segments.push(
          h('div', { style: { flex: 1, height: '100%', background: color } }),
        );
      }
      for (let i = 0; i < empty; i++) {
        segments.push(
          h('div', { style: { flex: 1, height: '100%', background: '#334155' } }),
        );
      }
      return h('div', { style: { display: 'flex', width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 } }, ...segments);
    };

    const habitRow = (habit: HabitRow) => {
      const statusColor = habit.completed ? COLORS.done : COLORS.pending;
      const statusIcon = habit.completed ? ICON.done : ICON.notDone;
      return h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            background: '#0f172a',
            borderRadius: 8,
            marginBottom: 8,
            border: `1px solid ${COLORS.border}`,
          },
        },
        h(
          'div',
          { style: { fontSize: 20, marginRight: 10, color: COLORS.muted, fontWeight: 700 } },
          habit.icon ?? ICON.default,
        ),
        h(
          'div',
          { style: { flex: 1, fontSize: 18, color: COLORS.text, fontWeight: 500 } },
          habit.name,
        ),
        habit.streak > 0
          ? h(
              'div',
              { style: { fontSize: 14, color: '#fb923c', marginRight: 10, fontWeight: 600 } },
              `${ICON.streak}${habit.streak}`,
            )
          : null,
        h(
          'div',
          {
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
          },
          statusIcon,
        ),
      );
    };

    const memberCard = (m: MemberCardData) => {
      const accentColor = m.isCurrentUser ? COLORS.accent : '#a78bfa';
      const crown = m.isMaster ? ` ${ICON.master}` : '';
      return h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            background: COLORS.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            border: `2px solid ${m.isCurrentUser ? COLORS.accent : COLORS.border}`,
          },
        },
        h(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            },
          },
          h(
            'div',
            { style: { fontSize: 22, fontWeight: 700, color: COLORS.text } },
            `${m.name}${crown}`,
          ),
          h(
            'div',
            {
              style: {
                fontSize: 20,
                fontWeight: 700,
                color: accentColor,
              },
            },
            `${m.percent}%`,
          ),
        ),
        progressBar(m.percent, accentColor),
        h(
          'div',
          { style: { height: 12 } },
        ),
        ...m.habits.map((habit) => habitRow(habit)),
        h(
          'div',
          { style: { fontSize: 14, color: COLORS.muted, marginTop: 4 } },
          `${m.completed}/${m.total} completed${m.percent === 100 ? `  ${ICON.perfect}` : ''}`,
        ),
      );
    };

    const allMembers = [p.currentUser, ...p.otherMembers];
    const totalCompleted = allMembers.reduce((s, m) => s + m.completed, 0);
    const totalHabits = allMembers.reduce((s, m) => s + m.total, 0);
    const overallPercent = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;

    return h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: COLORS.bg,
          padding: 32,
          fontFamily: 'Noto Sans',
        },
      },
      // Header
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 20,
          },
        },
        h(
          'div',
          {
            style: {
              fontSize: 32,
              fontWeight: 800,
              color: COLORS.text,
              marginBottom: 6,
            },
          },
          `${ICON.header} Daily Habit Report`,
        ),
        h(
          'div',
          { style: { fontSize: 18, color: COLORS.muted, marginBottom: 2 } },
          `${ICON.tracker} ${p.trackerName}`,
        ),
        h(
          'div',
          { style: { fontSize: 16, color: COLORS.muted } },
          `${ICON.date} ${p.dateLabel}`,
        ),
        h(
          'div',
          { style: { fontSize: 18, color: COLORS.accent, marginTop: 10 } },
          `Hey ${p.userName}, ${ICON.wave}`,
        ),
      ),
      // Current user card
      memberCard(p.currentUser),
      // Other members
      ...p.otherMembers.map((m) => memberCard(m)),
      // Footer summary
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            background: '#0b1220',
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
            border: `1px solid ${COLORS.border}`,
          },
        },
        h(
          'div',
          {
            style: {
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.text,
              marginBottom: 8,
            },
          },
          `${ICON.summary} Group Summary`,
        ),
        h(
          'div',
          { style: { fontSize: 16, color: COLORS.muted, marginBottom: 4 } },
          `Total: ${totalCompleted}/${totalHabits} (${overallPercent}%)`,
        ),
        h(
          'div',
          { style: { fontSize: 18, color: COLORS.accent, fontWeight: 600 } },
          overallPercent === 100
            ? `${ICON.groupWin} Everyone nailed it today!`
            : overallPercent >= 75
              ? `${ICON.great} Great teamwork!`
              : `${ICON.push} Let's push harder tomorrow!`,
        ),
      ),
    );
  }
}