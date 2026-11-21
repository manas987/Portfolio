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

export const Mark = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden
    focusable="false"
    className={className}
  >
    <rect x="1" y="6" width="2" height="7" rx="0.7" />
    <rect x="5" y="2.5" width="2" height="10.5" rx="0.7" />
    <rect x="9" y="8" width="2" height="5" rx="0.7" />
    <rect x="13" y="4.5" width="2" height="8.5" rx="0.7" />
  </svg>
);
