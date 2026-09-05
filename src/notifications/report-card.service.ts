import { Injectable, Logger } from '@nestjs/common';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import * as fs from 'fs';
import * as path from 'path';

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

  async render(params: ReportImageParams): Promise<Buffer> {
    const width = 860;
    const height = this.estimateHeight(params);
    const malayalamFont = this.getMalayalamFont();

    const fonts: { name: string; data: Buffer; weight: 400 | 700 | 900; style: 'normal' }[] = [
      { name: 'Noto Sans', data: this.getFont(), weight: 400, style: 'normal' },
    ];

    if (malayalamFont) {
      fonts.push({ name: 'Noto Sans Malayalam', data: malayalamFont, weight: 400, style: 'normal' });
    }

    // Resolve emoji via twemoji for crisp rendering on all platforms
    const loadAdditionalAsset = async (code: string, segment: string): Promise<string> => {
      if (code === 'emoji') {
        const codePoint = [...segment].map((c) => c.codePointAt(0)!.toString(16)).join('-');
        const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoint}.svg`;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const svg = await res.text();
            return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
          }
        } catch {
          // fall back
        }
      }
      return '';
    };

    const svg = await satori(this.buildJsx(params) as never, {
      width,
      height,
      fonts,
      loadAdditionalAsset,
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
    return png;
  }

  private estimateHeight(p: ReportImageParams): number {
    const baseHeader = 220;
    const baseSummary = 160;
    const padding = 80;

    const allMembers = [p.currentUser, ...p.otherMembers];
    const memberCount = allMembers.length;
    const cardRows = Math.ceil(memberCount / 2);

    let rowsHeight = 0;
    for (let r = 0; r < cardRows; r++) {
      const m1 = allMembers[r * 2];
      const m2 = allMembers[r * 2 + 1];

      const count1 = (m1?.habits || []).reduce((acc, h) => acc + 1 + (h.subtasks?.length || 0), 0);
      const count2 = (m2?.habits || []).reduce((acc, h) => acc + 1 + (h.subtasks?.length || 0), 0);
      const maxItems = Math.max(count1, count2, 3);

      // Card header (avatar + bar) ~ 110px, table header ~ 36px, item ~ 44px, footer ~ 44px
      const cardH = 120 + 36 + maxItems * 44 + 48;
      rowsHeight += cardH + 16;
    }

    return Math.max(980, baseHeader + rowsHeight + baseSummary + padding);
  }

  private buildJsx(p: ReportImageParams) {
    const allMembers = [p.currentUser, ...p.otherMembers];
    const totalCompleted = allMembers.reduce((s, m) => s + m.completed, 0);
    const totalItems = allMembers.reduce((s, m) => s + m.total, 0);
    const overallPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    const pendingCount = Math.max(0, totalItems - totalCompleted);

    const mood = overallPercent === 100 ? 'perfect' : overallPercent >= 75 ? 'great' : 'push';
    const moodConfig = {
      perfect: { msg: 'Amazing progress today! Everyone nailed it! 🎉' },
      great:   { msg: 'Amazing progress today! Keep it up! 💪' },
      push:    { msg: "Good effort today! Let's push higher tomorrow! 🔥" },
    }[mood];

    // Helper for creating virtual DOM nodes for Satori
    const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]) => {
      const cleaned = children.filter((c) => c !== null && c !== undefined && c !== false);
      const next: Record<string, unknown> = { ...props };
      if (cleaned.length === 0) { /* empty */ }
      else if (cleaned.length === 1) { next.children = cleaned[0]; }
      else { next.children = cleaned; }
      return { type, props: next };
    };

    // Color themes for member cards (Lavender, Mint, Sky, Peach, Rose)
    const PALETTES = [
      {
        primary: '#7C3AED',
        primaryDark: '#6D28D9',
        accentBg: '#F5F3FF',
        cardBorder: '#DDD6FE',
        headerBg: '#EDE9FE',
        headerText: '#6D28D9',
        barFilled: '#8B5CF6',
        barEmpty: '#EDE9FE',
        avatarBg: '#DDD6FE',
        avatarText: '#5B21B6',
        avatarEmoji: '👧',
      },
      {
        primary: '#059669',
        primaryDark: '#047857',
        accentBg: '#F0FDF4',
        cardBorder: '#BBF7D0',
        headerBg: '#DCFCE7',
        headerText: '#047857',
        barFilled: '#10B981',
        barEmpty: '#DCFCE7',
        avatarBg: '#BBF7D0',
        avatarText: '#065F46',
        avatarEmoji: '👦',
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
        avatarBg: '#BAE6FD',
        avatarText: '#075985',
        avatarEmoji: '🧑',
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
        avatarBg: '#FED7AA',
        avatarText: '#9A3412',
        avatarEmoji: '🌸',
      },
    ];

    // Segmented Progress Bar (10 rounded pill segments)
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
              height: 10,
              borderRadius: 5,
              background: isFilled ? filledColor : emptyColor,
              marginRight: i < totalSegments - 1 ? 5 : 0,
            },
          })
        );
      }
      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          marginTop: 10,
          marginBottom: 12,
        },
      }, ...segments);
    };

    // Habit Row inside User Card
    const habitRow = (habit: HabitRow) => {
      const done = habit.completed;
      const subtasks = habit.subtasks || [];
      const hasSubtasks = subtasks.length > 0;

      const completedSubCount = subtasks.filter((s) => s.completed).length;
      const progressText = hasSubtasks
        ? `${completedSubCount}/${subtasks.length}`
        : done ? '1/1' : '0/1';

      const mainRow = h('div', {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '8px 6px',
          borderBottom: hasSubtasks ? 'none' : '1px solid #F1F5F9',
        },
      },
        // Habit Icon + Name
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            gap: 10,
          },
        },
          h('div', { style: { fontSize: 20 } }, habit.icon ?? '📖'),
          h('div', {
            style: {
              fontSize: 18,
              fontWeight: 600,
              color: '#1E293B',
              fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
            },
          }, habit.name),
        ),

        // Progress fraction
        h('div', {
          style: {
            width: 70,
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 600,
            color: '#475569',
          },
        }, progressText),

        // Status circular check / cross icon
        h('div', {
          style: {
            width: 60,
            display: 'flex',
            justifyContent: 'flex-end',
          },
        },
          h('div', {
            style: {
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: done ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 900,
            },
          }, done ? '✓' : '✕'),
        ),
      );

      if (!hasSubtasks) {
        return mainRow;
      }

      // Render nested subtasks
      const subRows = subtasks.map((sub, idx) => {
        const subDone = sub.completed;
        const isLast = idx === subtasks.length - 1;
        return h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '5px 6px 5px 24px',
            borderBottom: isLast ? '1px solid #F1F5F9' : 'none',
          },
        },
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              gap: 6,
            },
          },
            h('div', { style: { fontSize: 13, color: '#94A3B8', fontWeight: 700 } }, '└─'),
            h('div', {
              style: {
                fontSize: 15,
                fontWeight: 500,
                color: subDone ? '#059669' : '#64748B',
                fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
              },
            }, sub.name),
          ),
          h('div', {
            style: {
              width: 70,
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: '#64748B',
            },
          }, subDone ? '1/1' : '0/1'),
          h('div', {
            style: {
              width: 60,
              display: 'flex',
              justifyContent: 'flex-end',
            },
          },
            h('div', {
              style: {
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: subDone ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 900,
              },
            }, subDone ? '✓' : '✕'),
          ),
        );
      });

      return h('div', { style: { display: 'flex', flexDirection: 'column' } }, mainRow, ...subRows);
    };

    // Member Card (User side-by-side card)
    const memberCard = (m: MemberCardData, index: number) => {
      const theme = PALETTES[index % PALETTES.length];

      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: 22,
          border: `2px solid ${theme.cardBorder}`,
          padding: '18px 20px',
          flex: 1,
        },
      },
        // Card Top: Avatar, Name + sparkle, Progress %
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
          // Avatar + Name
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            },
          },
            // Avatar Circle
            h('div', {
              style: {
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: theme.avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                border: `2px solid ${theme.cardBorder}`,
              },
            }, theme.avatarEmoji),

            // User Name
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 24,
                fontWeight: 900,
                color: theme.primaryDark,
                fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
              },
            },
              m.name,
              h('div', { style: { fontSize: 18, color: '#F59E0B' } }, '✨'),
              m.isMaster ? h('div', { style: { fontSize: 18 } }, '👑') : null,
            ),
          ),

          // Progress %
          h('div', {
            style: {
              fontSize: 26,
              fontWeight: 900,
              color: theme.primary,
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
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.headerBg,
            borderRadius: 12,
            padding: '8px 12px',
            marginBottom: 6,
          },
        },
          h('div', { style: { flex: 1, fontSize: 15, fontWeight: 700, color: theme.headerText } }, 'Habit'),
          h('div', { style: { width: 70, textAlign: 'center', fontSize: 15, fontWeight: 700, color: theme.headerText } }, 'Progress'),
          h('div', { style: { width: 60, textAlign: 'right', fontSize: 15, fontWeight: 700, color: theme.headerText } }, 'Status'),
        ),

        // Habit Rows
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          },
        },
          ...m.habits.map((habit) => habitRow(habit)),
          m.habits.length === 0
            ? h('div', { style: { fontSize: 16, color: '#94A3B8', textAlign: 'center', padding: '16px 0' } }, 'No habits yet')
            : null,
        ),

        // Card Footer: "X/Y completed"
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 8,
          },
        },
          h('div', {
            style: {
              fontSize: 15,
              fontWeight: 700,
              color: theme.primary,
            },
          }, `${m.completed}/${m.total} completed`),
          h('div', { style: { fontSize: 24 } }, m.percent >= 80 ? '🎉' : m.percent >= 50 ? '🌱' : '✨'),
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
        rowChildren.push(h('div', { style: { width: 20 } }));
        rowChildren.push(memberCard(right, i + 1));
      } else {
        rowChildren.push(h('div', { style: { width: 20 } }));
        rowChildren.push(h('div', { style: { flex: 1 } }));
      }
      memberRows.push(
        h('div', {
          style: { display: 'flex', flexDirection: 'row', width: '100%', marginBottom: 18 },
        }, ...rowChildren),
      );
    }

    // ─── Root Container ───────────────────────────────────────────────────────
    return h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#EFF6FF',
        padding: '28px',
        fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
      },
    },

      // Large White Rounded Card Wrapper
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: 32,
          border: '2px solid #E2E8F0',
          padding: '32px 34px',
          flex: 1,
        },
      },

        // ── Header Section ───────────────────────────────────────────────────
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
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
            // Main Bold Title
            h('div', {
              style: {
                fontSize: 44,
                fontWeight: 900,
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                lineHeight: 1.1,
              },
            },
              h('div', { style: { color: '#F59E0B' } }, '⭐'),
              'Daily Habit Report',
            ),

            // Subtitle / Tracker Name
            h('div', {
              style: {
                fontSize: 18,
                fontWeight: 600,
                color: '#475569',
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              },
            },
              '☀️ Morning Routine',
              h('div', { style: { color: '#CBD5E1', margin: '0 4px' } }, '•'),
              `📌 ${p.trackerName}`,
            ),

            // Date
            h('div', {
              style: {
                fontSize: 16,
                fontWeight: 500,
                color: '#64748B',
                marginTop: 4,
              },
            }, `📅 ${p.dateLabel}`),

            // Friendly Greeting
            h('div', {
              style: {
                fontSize: 20,
                fontWeight: 700,
                color: '#7C3AED',
                marginTop: 10,
                fontFamily: 'Noto Sans Malayalam, Noto Sans, sans-serif',
              },
            }, `Hey ${p.userName}! 👋 Keep going, you're doing great!`),
          ),

          // Right: Cute Illustrations (Smiling sun, cloud, plant)
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginLeft: 20,
            },
          },
            h('div', { style: { fontSize: 58 } }, '☀️'),
            h('div', { style: { fontSize: 42 } }, '☁️'),
            h('div', { style: { fontSize: 48 } }, '🪴'),
          ),
        ),

        // ── Main Content: Side-by-Side User Cards ─────────────────────────────
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          },
        }, ...memberRows),

        // ── Bottom Group Summary Card ─────────────────────────────────────────
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            background: '#FEF9C3',
            border: '2px solid #FDE047',
            borderRadius: 24,
            padding: '18px 24px',
            marginTop: 'auto',
          },
        },
          // Trophy on Left
          h('div', {
            style: {
              fontSize: 52,
              marginRight: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }, '🏆'),

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
                fontSize: 24,
                fontWeight: 900,
                color: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              },
            },
              'Group Summary',
              h('div', { style: { color: '#F59E0B' } }, '⭐'),
            ),
            h('div', {
              style: {
                fontSize: 18,
                fontWeight: 700,
                color: '#475569',
                marginTop: 3,
              },
            }, `Total: ${totalCompleted}/${totalItems} (${overallPercent}%)`),
            h('div', {
              style: {
                fontSize: 15,
                fontWeight: 600,
                color: '#D97706',
                marginTop: 3,
              },
            }, moodConfig.msg),
          ),

          // Donut Progress Ring
          h('div', {
            style: {
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: `conic-gradient(#8B5CF6 ${Math.round(overallPercent * 3.6)}deg, #E2E8F0 ${Math.round(overallPercent * 3.6)}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
            },
          },
            h('div', {
              style: {
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#FEF9C3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
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
              gap: 5,
              marginRight: 24,
            },
          },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 15,
                fontWeight: 600,
                color: '#334155',
              },
            },
              h('div', {
                style: {
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 900,
                },
              }, '✓'),
              `Completed ${totalCompleted}`,
            ),
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 15,
                fontWeight: 600,
                color: '#334155',
              },
            },
              h('div', {
                style: {
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 900,
                },
              }, '✕'),
              `Pending ${pendingCount}`,
            ),
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 15,
                fontWeight: 600,
                color: '#334155',
              },
            },
              h('div', { style: { fontSize: 15 } }, '👥'),
              `Participants ${allMembers.length}`,
            ),
          ),

          // Cute Rocket on Right
          h('div', {
            style: {
              fontSize: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }, '🚀'),
        ),
      ),
    );
  }
}