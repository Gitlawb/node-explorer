import type { CSSProperties, ReactElement, ReactNode } from 'react';

import type { RepoSocialModel } from '../../src/lib/repoSocial';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const colors = {
  background: '#0a0a0a',
  foreground: '#f2f2f2',
  surface: '#0d0d0d',
  border: '#1c1c1c',
  grid: '#131313',
  muted: '#8a8a8a',
  dim: '#555555',
  warm: '#c9a96e',
};

const verticalGridLines = Array.from({ length: Math.ceil(OG_WIDTH / 80) - 1 }, (_, index) =>
  (index + 1) * 80,
);
const horizontalGridLines = Array.from({ length: Math.ceil(OG_HEIGHT / 80) - 1 }, (_, index) =>
  (index + 1) * 80,
);

const labelStyle: CSSProperties = {
  color: colors.dim,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.16em',
  lineHeight: 1,
  textTransform: 'uppercase',
};

function truncateEnd(value: string, limit: number): string {
  const characters = Array.from(value);
  if (characters.length <= limit) return value;
  return `${characters.slice(0, Math.max(1, limit - 1)).join('')}…`;
}

function truncateMiddle(value: string, start = 10, end = 5): string {
  const characters = Array.from(value);
  if (characters.length <= start + end + 1) return value;
  return `${characters.slice(0, start).join('')}…${characters.slice(-end).join('')}`;
}

function graphemes(value: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), part => part.segment);
  }
  return Array.from(value);
}

function graphemeUnits(value: string): number {
  const codePoint = value.codePointAt(0) ?? 0;
  // CJK, emoji, and most astral glyphs occupy roughly two mono cells.
  return codePoint >= 0x1100 ? 2 : 1;
}

function textUnits(value: string): number {
  return graphemes(value).reduce((total, grapheme) => total + graphemeUnits(grapheme), 0);
}

/**
 * Satori's CSS line-clamp can generate clipping masks that affect unrelated
 * SVG layers. Fit the two lines explicitly so every card is deterministic.
 */
function fitLines(value: string, maxUnits: number, maxLines: number): string[] {
  let remaining = graphemes(value.trim());
  const lines: string[] = [];

  for (let lineIndex = 0; lineIndex < maxLines && remaining.length > 0; lineIndex += 1) {
    const isLastLine = lineIndex === maxLines - 1;
    const availableUnits = isLastLine ? Math.max(1, maxUnits - 1) : maxUnits;
    let usedUnits = 0;
    let cut = 0;

    while (cut < remaining.length) {
      const nextUnits = graphemeUnits(remaining[cut]);
      if (usedUnits + nextUnits > availableUnits) break;
      usedUnits += nextUnits;
      cut += 1;
    }

    if (cut === remaining.length) {
      lines.push(remaining.join('').trim());
      break;
    }

    if (!isLastLine) {
      const minimumBreak = Math.floor(cut * 0.55);
      for (let index = cut - 1; index >= minimumBreak; index -= 1) {
        if (remaining[index] === ' ' || remaining[index] === '-') {
          cut = index + 1;
          break;
        }
      }
    }

    const line = remaining.slice(0, Math.max(1, cut)).join('').trim();
    lines.push(isLastLine ? `${line}…` : line);
    remaining = remaining.slice(Math.max(1, cut));
    while (remaining[0] === ' ') remaining.shift();
  }

  return lines.length ? lines : ['—'];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'UNKNOWN';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date).toUpperCase();
}

function formatStars(value: number): string {
  if (value < 1_000) return String(value);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value).toUpperCase();
}

function nameFontSize(value: string): number {
  const length = textUnits(value);
  if (length <= 18) return 64;
  if (length <= 30) return 56;
  if (length <= 46) return 48;
  if (length <= 64) return 41;
  return 36;
}

function GridLines(): ReactElement {
  return (
    <div
      style={{
        bottom: 0,
        display: 'flex',
        left: 0,
        opacity: 0.7,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
      }}
    >
      {verticalGridLines.map(position => (
        <div
          key={`v-${position}`}
          style={{
            backgroundColor: colors.grid,
            bottom: 0,
            left: position,
            position: 'absolute',
            top: 0,
            width: 1,
          }}
        />
      ))}
      {horizontalGridLines.map(position => (
        <div
          key={`h-${position}`}
          style={{
            backgroundColor: colors.grid,
            height: 1,
            left: 0,
            position: 'absolute',
            right: 0,
            top: position,
          }}
        />
      ))}
    </div>
  );
}

function GitlawbMark(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill={colors.foreground}
      height="32"
      viewBox="313 266 400 493"
      width="26"
    >
      <path
        fillRule="evenodd"
        d="M 497.00 750.03 C485.24,743.21 466.66,732.70 457.28,727.55 L 448.06 722.50 L 448.03 680.86 L 448.00 639.23 L 457.25 634.00 C472.55,625.35 495.38,611.74 497.29,610.13 C498.98,608.70 499.07,604.95 498.96,544.16 L 498.83 479.70 L 509.52 468.98 C516.12,462.36 519.78,457.98 519.09,457.55 C517.38,456.50 512.87,447.13 511.36,441.50 C508.70,431.54 510.36,420.73 516.28,409.64 C525.33,392.64 544.72,383.56 564.80,386.91 C569.03,387.62 573.12,388.54 573.89,388.97 C574.87,389.51 581.57,383.50 596.59,368.62 L 617.89 347.50 L 615.62 343.50 C614.37,341.30 612.59,337.45 611.67,334.95 C609.76,329.79 607.97,314.14 609.19,313.38 C609.64,313.11 610.00,311.53 610.00,309.88 C610.00,305.54 617.45,290.81 622.02,286.10 C632.10,275.71 643.33,271.00 658.00,271.00 C673.15,271.00 683.48,275.28 694.01,285.93 C700.28,292.27 704.28,299.82 706.60,309.69 C708.71,318.66 707.93,326.65 703.93,337.01 C698.88,350.12 687.33,360.97 673.75,365.37 C672.13,365.90 672.00,368.50 671.99,401.22 L 671.99 436.50 L 607.84 500.75 C572.56,536.09 543.54,565.00 543.35,565.00 C543.16,565.00 543.00,557.01 543.00,547.25 L 543.00 529.49 L 594.50 478.00 L 646.00 426.51 L 646.00 396.41 L 646.00 366.32 L 641.84 365.07 L 637.68 363.82 L 616.65 384.85 L 595.62 405.88 L 598.95 412.69 C603.32,421.65 604.72,432.66 602.55,441.12 C598.99,454.99 590.73,465.73 578.90,471.86 C568.94,477.01 559.58,478.74 550.29,477.13 C546.56,476.49 542.74,475.86 541.81,475.73 C540.86,475.60 536.83,478.72 532.56,482.91 L 525.00 490.31 L 525.00 555.56 L 525.00 620.81 L 534.48 626.46 C539.69,629.57 544.22,632.54 544.54,633.06 C544.86,633.58 551.97,634.00 560.56,634.00 L 576.00 634.00 L 576.00 648.50 L 576.00 663.00 L 569.00 663.00 L 562.00 663.00 L 562.00 671.50 L 562.00 680.00 L 569.00 680.00 L 576.00 680.00 L 576.00 694.00 L 576.00 708.00 L 562.50 708.00 L 549.00 708.00 L 549.00 718.93 L 549.00 729.86 L 541.95 733.46 C535.72,736.63 523.94,743.23 510.00,751.35 C507.52,752.80 505.05,753.94 504.50,753.89 C503.95,753.84 500.58,752.10 497.00,750.03 ZM 511.08 713.20 C514.70,711.17 522.01,707.06 527.33,704.07 L 537.00 698.65 L 537.00 681.04 L 537.00 663.43 L 520.61 653.70 L 504.21 643.97 L 491.36 651.80 C484.28,656.11 477.49,660.28 476.25,661.06 C474.05,662.45 474.00,662.88 474.00,681.03 L 474.00 699.57 L 480.75 703.50 C484.46,705.66 488.85,708.18 490.50,709.09 C492.15,710.00 495.75,712.12 498.50,713.80 C501.25,715.47 503.73,716.86 504.00,716.88 C504.27,716.89 507.46,715.24 511.08,713.20 ZM 568.76 449.19 C573.99,445.04 576.64,440.72 577.50,434.93 C578.77,426.29 575.09,418.69 567.27,413.86 C564.48,412.13 562.10,411.60 557.06,411.59 C546.92,411.55 540.78,415.60 537.06,424.78 C534.39,431.38 537.72,443.87 543.25,447.98 C549.18,452.37 551.47,453.12 558.07,452.79 C563.71,452.50 565.22,451.99 568.76,449.19 ZM 667.79 340.09 C676.34,335.68 682.71,325.21 681.63,317.34 C679.43,301.30 663.73,292.08 649.05,298.22 C636.76,303.35 631.78,317.81 638.05,330.10 C640.14,334.19 644.98,338.64 649.50,340.61 C654.06,342.60 663.43,342.34 667.79,340.09 ZM 416.71 500.21 L 353.00 436.49 L 352.97 401.00 L 352.95 365.50 L 345.09 361.78 C333.75,356.42 326.93,349.80 321.74,339.12 L 317.54 330.50 L 317.57 318.82 C317.60,307.16 317.61,307.13 321.76,298.76 C327.23,287.71 333.74,281.21 344.87,275.71 L 353.37 271.50 L 366.05 271.53 C378.60,271.56 378.80,271.60 386.11,275.22 C397.22,280.73 404.22,287.50 408.97,297.35 C416.92,313.84 416.92,324.90 408.95,340.60 C403.93,350.48 390.68,361.76 381.15,364.25 C379.01,364.81 379.00,364.93 379.00,395.29 L 379.00 425.78 L 429.98 476.20 L 480.95 526.63 L 481.11 544.85 C481.20,554.87 481.08,563.26 480.84,563.49 C480.61,563.73 451.75,535.25 416.71,500.21 ZM 376.60 338.75 C384.76,333.26 390.02,323.13 388.50,315.85 C387.60,311.52 383.65,304.69 380.22,301.50 C376.25,297.82 368.85,295.64 363.20,296.49 C343.65,299.42 336.23,320.82 349.77,335.23 C353.82,339.54 359.76,342.00 366.14,342.00 C370.84,342.00 372.57,341.46 376.60,338.75 Z"
      />
    </svg>
  );
}

function Header(): ReactElement {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
        height: 44,
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
        <GitlawbMark />
        <div
          style={{
            color: colors.foreground,
            display: 'flex',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginLeft: 14,
          }}
        >
          gitlawb
        </div>
        <div
          style={{
            color: colors.dim,
            display: 'flex',
            fontSize: 17,
            marginLeft: 8,
          }}
        >
          / explorer
        </div>
      </div>
      <div
        style={{
          alignItems: 'center',
          border: `1px solid ${colors.border}`,
          color: colors.muted,
          display: 'flex',
          fontSize: 12,
          fontWeight: 700,
          height: 32,
          letterSpacing: '0.15em',
          padding: '0 14px',
          textTransform: 'uppercase',
        }}
      >
        Repository
      </div>
    </div>
  );
}

function Pill({ children, accent = false }: { children: ReactNode; accent?: boolean }): ReactElement {
  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: accent ? 'rgba(201, 169, 110, 0.08)' : colors.surface,
        border: `1px solid ${accent ? 'rgba(201, 169, 110, 0.45)' : colors.border}`,
        color: accent ? colors.warm : colors.muted,
        display: 'flex',
        fontSize: 12,
        fontWeight: 700,
        height: 32,
        letterSpacing: '0.1em',
        padding: '0 13px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  width: string;
  last?: boolean;
}

function Stat({ label, value, width, last = false }: StatProps): ReactElement {
  return (
    <div
      style={{
        borderRight: last ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: last ? 24 : 0,
        width,
      }}
    >
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          color: colors.foreground,
          display: 'flex',
          fontSize: 16,
          lineHeight: 1.2,
          marginTop: 9,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        display: 'flex',
        fontFamily: 'JetBrains Mono',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <GridLines />
      <div
        style={{
          border: `1px solid ${colors.border}`,
          bottom: 24,
          display: 'flex',
          left: 24,
          position: 'absolute',
          right: 24,
          top: 24,
        }}
      />
      <div
        style={{
          backgroundColor: colors.warm,
          display: 'flex',
          height: 2,
          left: 48,
          position: 'absolute',
          top: 24,
          width: 128,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '48px 56px 42px',
          position: 'relative',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function RepositoryOgCard({ model }: { model: RepoSocialModel }): ReactElement {
  const owner = truncateMiddle(model.owner.key || model.owner.display, 10, 5);
  const fontSize = nameFontSize(model.name);
  const nameLines = fitLines(model.name, Math.floor(1000 / (fontSize * 0.62)), 2);
  const descriptionLines = fitLines(model.description, 80, 2);

  return (
    <Frame>
      <Header />
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          marginTop: 27,
          minHeight: 0,
        }}
      >
        <div
          style={{
            color: colors.warm,
            display: 'flex',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {model.owner.display || 'unknown'} /
        </div>
        <div
          style={{
            color: colors.foreground,
            display: 'flex',
            flexDirection: 'column',
            marginTop: 8,
            maxWidth: 1030,
          }}
        >
          {nameLines.map((line, index) => (
            <div
              key={`${index}-${line}`}
              style={{
                color: colors.foreground,
                display: 'flex',
                fontSize,
                fontWeight: 700,
                letterSpacing: '-0.055em',
                lineHeight: 1.04,
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            color: colors.muted,
            display: 'flex',
            flexDirection: 'column',
            marginTop: 16,
            maxWidth: 1010,
          }}
        >
          {descriptionLines.map((line, index) => (
            <div
              key={`${index}-${line}`}
              style={{
                color: colors.muted,
                display: 'flex',
                fontSize: 20,
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
            gap: 9,
            marginTop: 21,
          }}
        >
          <Pill accent>{truncateEnd(model.branch, 28)}</Pill>
          <Pill>{model.visibility}</Pill>
          {model.isFork ? <Pill>fork</Pill> : null}
        </div>
      </div>
      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'row',
          height: 74,
          paddingTop: 17,
          width: '100%',
        }}
      >
        <Stat label="Owner" value={owner || 'UNKNOWN'} width="36%" />
        <Stat label="Updated" value={formatDate(model.updatedAt)} width="24%" />
        <Stat label="Created" value={formatDate(model.createdAt)} width="24%" />
        <Stat label="Stars" value={formatStars(model.stars)} width="16%" last />
      </div>
    </Frame>
  );
}

export function GenericOgCard(): ReactElement {
  return (
    <Frame>
      <Header />
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 1000,
          paddingBottom: 20,
        }}
      >
        <div style={labelStyle}>Federated git / public network</div>
        <div
          style={{
            color: colors.foreground,
            display: 'flex',
            fontSize: 57,
            fontWeight: 700,
            letterSpacing: '-0.055em',
            lineHeight: 1.08,
            marginTop: 20,
          }}
        >
          Explore the gitlawb network.
        </div>
        <div
          style={{
            color: colors.muted,
            display: 'flex',
            fontSize: 21,
            lineHeight: 1.45,
            marginTop: 22,
            maxWidth: 900,
          }}
        >
          Browse repositories, inspect history, and verify federated activity.
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 28 }}>
          <Pill accent>Live repository explorer</Pill>
        </div>
      </div>
      <div
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${colors.border}`,
          color: colors.dim,
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          fontSize: 15,
          height: 52,
          justifyContent: 'space-between',
          letterSpacing: '0.05em',
          paddingTop: 12,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex' }}>explorer.gitlawb.com</div>
        <div style={{ color: colors.warm, display: 'flex' }}>OPEN / VERIFY / FEDERATE</div>
      </div>
    </Frame>
  );
}
