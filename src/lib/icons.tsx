type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const ArrowUpRight = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
  </svg>
);

export const ArrowDownRight = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4.5 4.5 11.5 11.5M11.5 5.5v6h-6" />
  </svg>
);

export const ArrowLeft = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 8H4M7.5 4.5 4 8l3.5 3.5" />
  </svg>
);

export const ArrowRight = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 8h8M8.5 4.5 12 8l-3.5 3.5" />
  </svg>
);

export const ArrowUp = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" />
  </svg>
);

export const Close = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const SoundOn = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M2.5 6v4h2.5l3.5 3V3L5 6H2.5Z" />
    <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4" />
  </svg>
);

export const SoundOff = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M2.5 6v4h2.5l3.5 3V3L5 6H2.5Z" />
    <path d="m11 6 3.5 4M14.5 6 11 10" />
  </svg>
);

export const Message = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={1.15}>
    <path d="M13.5 9.2a2.3 2.3 0 0 1-2.3 2.3H6.4L3.5 13.7V5.3A2.3 2.3 0 0 1 5.8 3h5.4a2.3 2.3 0 0 1 2.3 2.3Z" />
  </svg>
);

/**
 * The mark: a pixel-font lowercase m built from dither cells that shrink and break apart
 * toward the bottom, the way the hero's head dissolves. [column, row, size] on a 5-wide grid.
 * public/favicon.svg is generated from these cells on an ink tile; keep the two in step.
 */
export const MARK_CELLS: [number, number, number][] = [
  [0, 0, 2.2], [1, 0, 2.2], [3, 0, 2.2],
  [0, 1, 2.2], [2, 1, 2.2], [4, 1, 2.2],
  [0, 2, 2.2], [2, 2, 2.0], [4, 2, 2.2],
  [0, 3, 1.9], [2, 3, 1.5], [4, 3, 1.8],
  [0, 4, 1.3], [4, 4, 1.0],
  [2, 5, 0.8], [4, 5, 0.55],
];

export const markRect = ([c, r, s]: [number, number, number]) => ({
  x: +(2.8 + c * 2.6 - s / 2).toFixed(2),
  y: +(1.5 + r * 2.6 - s / 2).toFixed(2),
  width: s,
  height: s,
});

export const Mark = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable="false" className={className}>
    {MARK_CELLS.map((cell) => (
      <rect key={`${cell[0]}-${cell[1]}`} {...markRect(cell)} rx="0.3" />
    ))}
  </svg>
);
