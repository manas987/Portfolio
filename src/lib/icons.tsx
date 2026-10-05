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

export const Play = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" strokeWidth={0}>
    <path d="M5 3.4v9.2a.5.5 0 0 0 .76.43l7.2-4.6a.5.5 0 0 0 0-.86l-7.2-4.6A.5.5 0 0 0 5 3.4Z" />
  </svg>
);

export const Pause = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" strokeWidth={0}>
    <rect x="4.25" y="3.25" width="2.75" height="9.5" rx="0.6" />
    <rect x="9" y="3.25" width="2.75" height="9.5" rx="0.6" />
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
