import type { SVGProps } from "react";

export const iconNames = [
  "calendar",
  "check",
  "chevronRight",
  "clock",
  "close",
  "keyboard",
  "menu",
  "mic",
  "plus",
  "sparkles",
  "timeline",
] as const;

export type IconName = (typeof iconNames)[number];

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  title?: string;
};

const paths: Record<IconName, string[]> = {
  calendar: [
    "M7 2v3",
    "M17 2v3",
    "M3.5 9h17",
    "M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  ],
  check: ["m5 12 4.5 4.5L19 7"],
  chevronRight: ["m9 18 6-6-6-6"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  close: ["m6 6 12 12", "m18 6-12 12"],
  keyboard: [
    "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z",
    "M6 10h.01",
    "M10 10h.01",
    "M14 10h.01",
    "M18 10h.01",
    "M8 14h8",
  ],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  mic: [
    "M12 14a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Z",
    "M19 10a7 7 0 0 1-14 0",
    "M12 17v4",
  ],
  plus: ["M12 5v14", "M5 12h14"],
  sparkles: [
    "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z",
    "M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z",
    "M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z",
  ],
  timeline: [
    "M6 4v16",
    "M6 7h12",
    "M6 12h9",
    "M6 17h12",
    "M4 7h4",
    "M4 12h4",
    "M4 17h4",
  ],
};

export function Icon({
  name,
  size = 20,
  title,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) {
  const titleId = title ? `${name}-icon-title` : undefined;

  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-labelledby={titleId}
      fill="none"
      height={size}
      role={title ? "img" : undefined}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {paths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
