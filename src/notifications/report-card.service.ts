import { Injectable, Logger } from '@nestjs/common';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import * as fs from 'fs';
import * as path from 'path';

// Clean, 100% Satori-compatible inline SVGs (zero tofu / missing font characters)
const SVGS = {
  star: (size = 24, color = '#F59E0B') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: color,
      children: [{ type: 'polygon', props: { points: '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26' } }],
    },
  }),
  sun: (size = 56) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'circle', props: { cx: 12, cy: 12, r: 5, fill: '#FBBF24' } },
        { type: 'path', props: { d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42', stroke: '#F59E0B', strokeWidth: 2, strokeLinecap: 'round' } },
      ],
    },
  }),
  cloud: (size = 44) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z', fill: '#BAE6FD' } },
      ],
    },
  }),
  plant: (size = 48) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M7 14h10l-1.5 7h-7L7 14z', fill: '#B45309' } },
        { type: 'path', props: { d: 'M12 14V6M12 6c-2-3-6-2-6 2s4 4 6 4M12 9c2-2 5-1 5 2s-3 3-5 3', stroke: '#10B981', strokeWidth: 2, strokeLinecap: 'round', fill: 'none' } },
      ],
    },
  }),
  trophy: (size = 56) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M6 9V2h12v7a6 6 0 0 1-12 0Z', fill: '#F59E0B' } },
        { type: 'path', props: { d: 'M6 4H3a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1M18 4h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1', stroke: '#F59E0B', strokeWidth: 2, fill: 'none' } },
        { type: 'path', props: { d: 'M12 15v4M8 22h8M10 19h4', stroke: '#D97706', strokeWidth: 2, strokeLinecap: 'round', fill: 'none' } },
      ],
    },
  }),
  rocket: (size = 56) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z', fill: '#EF4444' } },
        { type: 'path', props: { d: 'M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z', fill: '#3B82F6' } },
        { type: 'circle', props: { cx: 15, cy: 9, r: 2, fill: '#FFFFFF' } },
      ],
    },
  }),
  avatarGirl: (size = 68) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 64 64',
      children: [
        { type: 'circle', props: { cx: 32, cy: 32, r: 30, fill: '#DDD6FE' } },
        { type: 'circle', props: { cx: 32, cy: 30, r: 16, fill: '#FDE047' } },
        { type: 'circle', props: { cx: 32, cy: 28, r: 13, fill: '#FED7AA' } },
        { type: 'circle', props: { cx: 28, cy: 28, r: 2, fill: '#1E293B' } },
        { type: 'circle', props: { cx: 36, cy: 28, r: 2, fill: '#1E293B' } },
        { type: 'path', props: { d: 'M29 33 Q32 36 35 33', stroke: '#E11D48', strokeWidth: 1.5, fill: 'none' } },
        { type: 'path', props: { d: 'M18 54 Q32 44 46 54', fill: '#8B5CF6' } },
      ],
    },
  }),
  avatarBoy: (size = 68) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 64 64',
      children: [
        { type: 'circle', props: { cx: 32, cy: 32, r: 30, fill: '#BBF7D0' } },
        { type: 'circle', props: { cx: 32, cy: 26, r: 15, fill: '#334155' } },
        { type: 'circle', props: { cx: 32, cy: 29, r: 13, fill: '#FED7AA' } },
        { type: 'circle', props: { cx: 28, cy: 28, r: 2, fill: '#1E293B' } },
        { type: 'circle', props: { cx: 36, cy: 28, r: 2, fill: '#1E293B' } },
        { type: 'path', props: { d: 'M29 33 Q32 36 35 33', stroke: '#E11D48', strokeWidth: 1.5, fill: 'none' } },
        { type: 'path', props: { d: 'M18 54 Q32 44 46 54', fill: '#10B981' } },
      ],
    },
  }),
  check: (size = 14, color = '#FFFFFF') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M5 13l4 4L19 7', stroke: color, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } },
      ],
    },
  }),
  cross: (size = 14, color = '#FFFFFF') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M6 18L18 6M6 6l12 12', stroke: color, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } },
      ],
    },
  }),
  crown: (size = 20, color = '#F59E0B') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M2 4l3 12h14l3-12-5 4-5-6-5 6-5-4z', fill: color } },
        { type: 'path', props: { d: 'M5 18h14v2H5z', fill: color } },
      ],
    },
  }),
  calendar: (size = 18, color = '#64748B') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'rect', props: { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2, stroke: color, strokeWidth: 2, fill: 'none' } },
        { type: 'line', props: { x1: 16, y1: 2, x2: 16, y2: 6, stroke: color, strokeWidth: 2, strokeLinecap: 'round' } },
        { type: 'line', props: { x1: 8, y1: 2, x2: 8, y2: 6, stroke: color, strokeWidth: 2, strokeLinecap: 'round' } },
        { type: 'line', props: { x1: 3, y1: 10, x2: 21, y2: 10, stroke: color, strokeWidth: 2 } },
      ],
    },
  }),
  pin: (size = 18, color = '#EF4444') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z', fill: color } },
        { type: 'circle', props: { cx: 12, cy: 9, r: 2.5, fill: '#FFFFFF' } },
      ],
    },
  }),
  corner: (size = 14, color = '#94A3B8') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M6 2v12h14', stroke: color, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } },
      ],
    },
  }),
  users: (size = 18, color = '#64748B') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', stroke: color, strokeWidth: 2, fill: 'none' } },
        { type: 'circle', props: { cx: 9, cy: 7, r: 4, stroke: color, strokeWidth: 2, fill: 'none' } },
        { type: 'path', props: { d: 'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', stroke: color, strokeWidth: 2, fill: 'none' } },
      ],
    },
  }),
  sparkle: (size = 20, color = '#7C3AED') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z', fill: color } },
      ],
    },
  }),
  book: (size = 24, color = '#6366F1') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20', stroke: color, strokeWidth: 2, fill: 'none' } },
        { type: 'path', props: { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z', stroke: color, strokeWidth: 2, fill: 'none' } },
      ],
    },
  }),
  runner: (size = 24, color = '#10B981') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'circle', props: { cx: 14, cy: 5, r: 2, fill: color } },
        { type: 'path', props: { d: 'M14 8l-3 4-3-1M11 12l2 4 4 2M8 11l-3 3M16 8l2 3', stroke: color, strokeWidth: 2, strokeLinecap: 'round', fill: 'none' } },
      ],
    },
  }),
  chat: (size = 24, color = '#8B5CF6') => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      children: [
        { type: 'path', props: { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', fill: color } },
      ],
    },
  }),
};

interface SubtaskRow {
  name: string;
  completed: boolean;
}

interface HabitRow {
  name: string;
  icon: string | null;
  completed: boolean;
  streak: number;
  subtasks: SubtaskRow[];
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
  private readonly malayalamFontPath = path.join(process.cwd(), 'assets', 'NotoSansMalayalam-Regular.woff');
  private cachedFont: Buffer | null = null;
  private cachedMalayalamFont: Buffer | null = null;

  private getFont(): Buffer {
    if (!this.cachedFont) {
      this.cachedFont = fs.readFileSync(this.fontPath);
    }
    return this.cachedFont;
  }

  private getMalayalamFont(): Buffer | null {
    if (!this.cachedMalayalamFont) {
      if (fs.existsSync(this.malayalamFontPath)) {
        this.cachedMalayalamFont = fs.readFileSync(this.malayalamFontPath);
      }
    }
    return this.cachedMalayalamFont;
  }

  estimateHeight(p: ReportImageParams): number {
    const allMembers = [p.currentUser, ...p.otherMembers];
    const memberCount = allMembers.length;
    const cardRows = Math.ceil(memberCount / 2);

    let totalCardRowsHeight = 0;
    for (let r = 0; r < cardRows; r++) {
      const m1 = allMembers[r * 2];
      const m2 = allMembers[r * 2 + 1];

      const count1 = (m1?.habits || []).reduce((acc, h) => acc + 1 + (h.subtasks?.length || 0), 0);
      const count2 = (m2?.habits || []).reduce((acc, h) => acc + 1 + (h.subtasks?.length || 0), 0);
      const maxItems = Math.max(count1, count2, 5);

      // Card: Header (70) + Progress Bar (40) + Table Header (42) + (maxItems * 58) + Footer (50) + Card Padding (48)
      const cardHeight = 70 + 40 + 42 + (maxItems * 58) + 50 + 48;
      totalCardRowsHeight += cardHeight + 20;
    }

    const outerPadding = 64;
    const whiteContainerPadding = 72;
    const headerHeight = 150;
    const summaryHeight = 170;
    const gap = 24;

    return outerPadding + whiteContainerPadding + headerHeight + totalCardRowsHeight + gap + summaryHeight + 20;
  }

  async render(params: ReportImageParams): Promise<Buffer> {
    const width = 1080;
    const height = this.estimateHeight(params);
    const font = this.getFont();
    const malayalamFont = this.getMalayalamFont();

    const fonts: { name: string; data: Buffer; weight: 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' }[] = [
      { name: 'Noto Sans', data: font, weight: 400, style: 'normal' },
      { name: 'Noto Sans', data: font, weight: 600, style: 'normal' },
      { name: 'Noto Sans', data: font, weight: 700, style: 'normal' },
      { name: 'Noto Sans', data: font, weight: 900, style: 'normal' },
    ];

    if (malayalamFont) {
      fonts.push(
        { name: 'Noto Sans Malayalam', data: malayalamFont, weight: 400, style: 'normal' },
        { name: 'Noto Sans Malayalam', data: malayalamFont, weight: 600, style: 'normal' },
        { name: 'Noto Sans Malayalam', data: malayalamFont, weight: 700, style: 'normal' },
        { name: 'Noto Sans Malayalam', data: malayalamFont, weight: 900, style: 'normal' },
      );
    }

    const svg = await satori(this.buildJsx(params) as never, {
      width,
      height,
      fonts,
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
    return png;
  }

  private buildJsx(p: ReportImageParams) {
    const allMembers = [p.currentUser, ...p.otherMembers];
    const totalCompleted = allMembers.reduce((s, m) => s + m.completed, 0);
    const totalItems = allMembers.reduce((s, m) => s + m.total, 0);
    const overallPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    const pendingCount = Math.max(0, totalItems - totalCompleted);

    const mood = overallPercent === 100 ? 'perfect' : overallPercent >= 75 ? 'great' : 'push';
    const moodConfig = {
      perfect: { msg: 'Amazing progress today! Everyone nailed it!' },
      great:   { msg: 'Amazing progress today! Keep it up!' },
      push:    { msg: "Good effort today! Let's push higher tomorrow!" },
    }[mood];

    // Helper for creating virtual DOM nodes for Satori
    const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]) => {
      const cleaned = children.filter((c) => c !== null && c !== undefined && c !== false);
      const next: Record<string, unknown> = { ...props };
      const style = { ...((next.style as Record<string, unknown>) || {}) };
      if (type === 'div') {
        if (!style.display) {
          style.display = 'flex';
        }
        if (!style.flexDirection) {
          style.flexDirection = 'column';
        }
      }
      next.style = style;
      if (cleaned.length === 0) { /* empty */ }
      else if (cleaned.length === 1) { next.children = cleaned[0]; }
      else { next.children = cleaned; }
      return { type, props: next };
    };

    const PALETTES = [
      {
        primary: '#7C3AED',
        primaryDark: '#5B21B6',
        accentBg: '#F5F3FF',
        cardBorder: '#DDD6FE',
        headerBg: '#EDE9FE',
        headerText: '#5B21B6',
        barFilled: '#8B5CF6',
        barEmpty: '#EDE9FE',
        avatar: SVGS.avatarGirl(68),
      },
      {
        primary: '#059669',
        primaryDark: '#065F46',
        accentBg: '#F0FDF4',
        cardBorder: '#BBF7D0',
        headerBg: '#DCFCE7',
        headerText: '#065F46',
        barFilled: '#10B981',
        barEmpty: '#DCFCE7',
        avatar: SVGS.avatarBoy(68),
      },
      {
        primary: '#0284C7',
        primaryDark: '#0369A1',
        accentBg: '#F0F9FF',
        cardBorder: '#BAE6FD',
        headerBg: '#E0F2FE',
        headerText: '#0369A1',
        barFilled: '#0EA5E9',
        barEmpty: '#E0F2FE',
        avatar: SVGS.avatarBoy(68),
      },
      {
        primary: '#EA580C',
        primaryDark: '#C2410C',
        accentBg: '#FFF7ED',
        cardBorder: '#FED7AA',
        headerBg: '#FFEDD5',
        headerText: '#C2410C',
        barFilled: '#F97316',
        barEmpty: '#FFEDD5',
        avatar: SVGS.avatarGirl(68),
      },
    ];

    // Helper: 10-Segment Progress Bar
    const segmentedBar = (percent: number, filledColor: string, emptyColor: string) => {
      const totalSegments = 10;
      const filledCount = Math.round((percent / 100) * totalSegments);
      const segments: unknown[] = [];
      for (let i = 0; i < totalSegments; i++) {
        const isFilled = i < filledCount;
        segments.push(
          h('div', {
            style: {
              flex: 1,
              height: 12,
              borderRadius: 6,
              background: isFilled ? filledColor : emptyColor,
              marginRight: i < totalSegments - 1 ? 6 : 0,
            },
          })
        );
      }
      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          marginTop: 12,
          marginBottom: 16,
          boxSizing: 'border-box',
        },
      }, ...segments);
    };

    // Helper: Habit Row
    const habitRow = (habit: HabitRow) => {
      const done = habit.completed;
      const subtasks = habit.subtasks || [];
      const hasSubtasks = subtasks.length > 0;

      const completedSubCount = subtasks.filter((s) => s.completed).length;
      const progressText = hasSubtasks
        ? `${completedSubCount}/${subtasks.length}`
        : done ? '1/1' : '0/1';

      let iconNode: unknown = null;
      if (habit.name.toLowerCase().includes('read') || habit.name.toLowerCase().includes('skill')) {
        iconNode = SVGS.book(26, '#6366F1');
      } else if (habit.name.toLowerCase().includes('exercise') || habit.name.toLowerCase().includes('walk') || habit.name.toLowerCase().includes('run')) {
        iconNode = SVGS.runner(26, '#10B981');
      } else if (habit.name.toLowerCase().includes('english') || habit.name.toLowerCase().includes('practice') || habit.name.toLowerCase().includes('chat')) {
        iconNode = SVGS.chat(26, '#8B5CF6');
      } else {
        iconNode = SVGS.book(26, '#EC4899');
      }

      const mainRow = h('div', {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          height: 58,
          minHeight: 58,
          boxSizing: 'border-box',
          padding: '0 8px',
          borderBottom: hasSubtasks ? 'none' : '1px solid #F1F5F9',
        },
      },
        // Habit Icon + Name Column
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          },
        },
          h('div', {
            style: {
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            },
          }, iconNode),
          h('div', {
            style: {
              marginLeft: 12,
              fontSize: 18,
              fontWeight: 600,
              color: '#1E293B',
              fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            },
          }, habit.name),
        ),

        // Progress fraction Column
        h('div', {
          style: {
            width: 85,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 600,
            color: '#475569',
          },
        }, progressText),

        // Status circular check / cross icon Column
        h('div', {
          style: {
            width: 65,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
          h('div', {
            style: {
              width: 28,
              height: 28,
              borderRadius: 14,
              background: done ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }, done ? SVGS.check(16, '#FFFFFF') : SVGS.cross(14, '#FFFFFF')),
        ),
      );

      if (!hasSubtasks) {
        return mainRow;
      }

      // Subtasks rows
      const subRows = subtasks.map((sub, idx) => {
        const subDone = sub.completed;
        const isLast = idx === subtasks.length - 1;
        return h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 44,
            minHeight: 44,
            boxSizing: 'border-box',
            padding: '0 8px 0 28px',
            borderBottom: isLast ? '1px solid #F1F5F9' : 'none',
          },
        },
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
            },
          },
            h('div', { style: { display: 'flex', marginRight: 8, alignItems: 'center' } }, SVGS.corner(14, '#94A3B8')),
            h('div', {
              style: {
                fontSize: 15,
                fontWeight: 500,
                color: subDone ? '#059669' : '#64748B',
                fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              },
            }, sub.name),
          ),
          h('div', {
            style: {
              width: 85,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: '#64748B',
            },
          }, subDone ? '1/1' : '0/1'),
          h('div', {
            style: {
              width: 65,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
            h('div', {
              style: {
                width: 22,
                height: 22,
                borderRadius: 11,
                background: subDone ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            }, subDone ? SVGS.check(12, '#FFFFFF') : SVGS.cross(10, '#FFFFFF')),
          ),
        );
      });

      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        },
      }, mainRow, ...subRows);
    };

    // Helper: Member Card
    const memberCard = (m: MemberCardData, index: number) => {
      const theme = PALETTES[index % PALETTES.length];

      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          boxSizing: 'border-box',
          background: '#FFFFFF',
          borderRadius: 24,
          border: `2px solid ${theme.cardBorder}`,
          padding: '24px',
        },
      },
        // Card Top Header: Avatar + Name + Percentage
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 70,
            boxSizing: 'border-box',
          },
        },
          theme.avatar,
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 14,
              fontSize: 26,
              fontWeight: 900,
              color: theme.primaryDark,
              fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
            },
          },
            h('div', { style: { display: 'flex' } }, m.name),
            h('div', { style: { display: 'flex', marginLeft: 8 } }, SVGS.star(20, '#F59E0B')),
            m.isMaster ? h('div', { style: { display: 'flex', marginLeft: 6 } }, SVGS.crown(20, '#F59E0B')) : null,
          ),
          h('div', {
            style: {
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 28,
              fontWeight: 900,
              color: theme.primary,
              flexShrink: 0,
            },
          }, `${m.percent}%`),
        ),

        // Horizontal Segmented Progress Bar
        segmentedBar(m.percent, theme.barFilled, theme.barEmpty),

        // Habit Table Header
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 42,
            boxSizing: 'border-box',
            background: theme.headerBg,
            borderRadius: 12,
            padding: '0 12px',
            marginBottom: 6,
          },
        },
          h('div', { style: { flex: 1, fontSize: 15, fontWeight: 700, color: theme.headerText } }, 'Habit'),
          h('div', { style: { width: 85, display: 'flex', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: theme.headerText } }, 'Progress'),
          h('div', { style: { width: 65, display: 'flex', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: theme.headerText } }, 'Status'),
        ),

        // Habit Table Rows (Vertical column of rows)
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            boxSizing: 'border-box',
          },
        },
          ...m.habits.map((habit) => habitRow(habit)),
          m.habits.length === 0
            ? h('div', { style: { fontSize: 16, color: '#94A3B8', textAlign: 'center', padding: '20px 0' } }, 'No habits yet')
            : null,
        ),

        // Card Footer: "X/Y completed"
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginTop: 18,
            paddingTop: 8,
            boxSizing: 'border-box',
          },
        },
          h('div', {
            style: {
              fontSize: 16,
              fontWeight: 700,
              color: theme.primary,
            },
          }, `${m.completed}/${m.total} completed`),
          h('div', { style: { display: 'flex', alignItems: 'center' } }, SVGS.sparkle(20, theme.primary)),
        ),
      );
    };

    // ─── Build 2-column member grid ───────────────────────────────────────────
    const memberRows: unknown[] = [];
    for (let i = 0; i < allMembers.length; i += 2) {
      const left = allMembers[i];
      const right = allMembers[i + 1];
      const rowChildren: unknown[] = [memberCard(left, i)];
      if (right) {
        rowChildren.push(h('div', { style: { width: 24, flexShrink: 0 } }));
        rowChildren.push(memberCard(right, i + 1));
      } else {
        rowChildren.push(h('div', { style: { width: 24, flexShrink: 0 } }));
        rowChildren.push(h('div', { style: { flex: 1 } }));
      }
      memberRows.push(
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            marginBottom: 20,
            boxSizing: 'border-box',
          },
        }, ...rowChildren),
      );
    }

    // ─── Root Layout ──────────────────────────────────────────────────────────
    return h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#EFF6FF',
        padding: '32px',
        boxSizing: 'border-box',
        fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
      },
    },

      // Large White Rounded Card Wrapper
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 32,
          border: '2px solid #E2E8F0',
          padding: '36px',
          boxSizing: 'border-box',
        },
      },

        // ── 1. Header Section ────────────────────────────────────────────────
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '100%',
            marginBottom: 20,
            boxSizing: 'border-box',
          },
        },
          // Left: Titles & Greeting
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            },
          },
            // Title
            h('div', {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              },
            },
              SVGS.star(36, '#F59E0B'),
              h('div', {
                style: {
                  fontSize: 40,
                  fontWeight: 900,
                  color: '#0F172A',
                  marginLeft: 10,
                },
              }, 'Daily Habit Report'),
            ),

            // Subtitle
            h('div', {
              style: {
                fontSize: 18,
                fontWeight: 600,
                color: '#475569',
                marginTop: 6,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              },
            },
              h('div', { style: { display: 'flex', marginRight: 6 } }, SVGS.sun(18)),
              h('div', { style: { display: 'flex' } }, 'Morning Routine • '),
              h('div', { style: { display: 'flex', marginLeft: 6, marginRight: 6 } }, SVGS.pin(16, '#EF4444')),
              h('div', { style: { display: 'flex' } }, p.trackerName),
            ),

            // Date
            h('div', {
              style: {
                fontSize: 16,
                fontWeight: 500,
                color: '#64748B',
                marginTop: 4,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              },
            },
              h('div', { style: { display: 'flex', marginRight: 6 } }, SVGS.calendar(16, '#64748B')),
              h('div', { style: { display: 'flex' } }, p.dateLabel),
            ),

            // Greeting
            h('div', {
              style: {
                fontSize: 20,
                fontWeight: 700,
                color: '#7C3AED',
                marginTop: 8,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
              },
            },
              h('div', { style: { display: 'flex' } }, `Hey ${p.userName}! Keep going, you're doing great!`),
              h('div', { style: { display: 'flex', marginLeft: 8 } }, SVGS.sparkle(20, '#7C3AED')),
            ),
          ),

          // Right: Decorative Icons (Sun, Cloud, Plant)
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 20,
              flexShrink: 0,
            },
          },
            h('div', { style: { display: 'flex', marginRight: 16 } }, SVGS.sun(56)),
            h('div', { style: { display: 'flex', marginRight: 16 } }, SVGS.cloud(44)),
            h('div', { style: { display: 'flex' } }, SVGS.plant(48)),
          ),
        ),

        // ── 2. Main Content: Side-by-Side User Cards ─────────────────────────
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            boxSizing: 'border-box',
          },
        }, ...memberRows),

        // ── 3. Bottom Group Summary Card (Directly below cards) ──────────────
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 170,
            background: '#FEF9C3',
            border: '2px solid #FDE047',
            borderRadius: 24,
            padding: '22px 30px',
            marginTop: 4,
            boxSizing: 'border-box',
          },
        },
          // Trophy on Left
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 22,
              flexShrink: 0,
            },
          }, SVGS.trophy(60)),

          // Summary Text
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            },
          },
            h('div', {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              },
            },
              h('div', {
                style: {
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#1E293B',
                },
              }, 'Group Summary'),
              h('div', { style: { display: 'flex', marginLeft: 8 } }, SVGS.star(20, '#F59E0B')),
            ),
            h('div', {
              style: {
                fontSize: 18,
                fontWeight: 700,
                color: '#475569',
                marginTop: 4,
                display: 'flex',
              },
            }, `Total: ${totalCompleted}/${totalItems} (${overallPercent}%)`),
            h('div', {
              style: {
                fontSize: 15,
                fontWeight: 600,
                color: '#D97706',
                marginTop: 4,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              },
            },
              h('div', { style: { display: 'flex', marginRight: 6 } }, SVGS.sparkle(16, '#D97706')),
              h('div', { style: { display: 'flex' } }, moodConfig.msg),
            ),
          ),

          // Donut Progress Ring (SVG)
          h('div', {
            style: {
              width: 84,
              height: 84,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 28,
              position: 'relative',
              flexShrink: 0,
            },
          },
            h('svg', {
              width: 84,
              height: 84,
              viewBox: '0 0 84 84',
              style: {
                position: 'absolute',
                transform: 'rotate(-90deg)',
              },
            },
              h('circle', {
                cx: 42,
                cy: 42,
                r: 34,
                stroke: '#E2E8F0',
                strokeWidth: 9,
                fill: 'none',
              }),
              h('circle', {
                cx: 42,
                cy: 42,
                r: 34,
                stroke: '#8B5CF6',
                strokeWidth: 9,
                strokeDasharray: '213.6',
                strokeDashoffset: (213.6 * (1 - overallPercent / 100)).toFixed(1),
                strokeLinecap: 'round',
                fill: 'none',
              }),
            ),
            h('div', {
              style: {
                fontSize: 20,
                fontWeight: 900,
                color: '#1E293B',
              },
            }, `${overallPercent}%`),
          ),

          // Stats Stack (Completed, Pending, Participants)
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              marginRight: 24,
              flexShrink: 0,
            },
          },
            h('div', {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontSize: 15,
                fontWeight: 600,
                color: '#334155',
              },
            },
              h('div', {
                style: {
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              }, SVGS.check(12, '#FFFFFF')),
              h('div', { style: { marginLeft: 8 } }, `Completed ${totalCompleted}`),
            ),
            h('div', {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontSize: 15,
                fontWeight: 600,
                color: '#334155',
              },
            },
              h('div', {
                style: {
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              }, SVGS.cross(11, '#FFFFFF')),
              h('div', { style: { marginLeft: 8 } }, `Pending ${pendingCount}`),
            ),
            h('div', {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontSize: 15,
                fontWeight: 600,
                color: '#334155',
              },
            },
              SVGS.users(18, '#64748B'),
              h('div', { style: { marginLeft: 8 } }, `Participants ${allMembers.length}`),
            ),
          ),

          // Rocket on Right
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            },
          }, SVGS.rocket(60)),
        ),
      ),
    );
  }
}