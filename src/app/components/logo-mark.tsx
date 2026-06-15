import { useId } from "react";

type LogoMarkProps = {
  className?: string;
  monochrome?: boolean;
  title?: string;
};

export function LogoMark({ className, monochrome = false, title = "Moonshot" }: LogoMarkProps) {
  const id = useId();
  const cutId = `${id}-moon-cut`;
  const innerId = `${id}-moon-inner`;
  const dark = monochrome ? "currentColor" : "var(--logo-primary, #0F0F0F)";
  const light = monochrome ? "currentColor" : "var(--logo-secondary, #D8D8D8)";
  const star = monochrome ? "currentColor" : "var(--logo-primary, #0F0F0F)";

  return (
    <svg
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <mask id={cutId} maskUnits="userSpaceOnUse">
        <rect width="320" height="320" fill="black" />
        <circle cx="150" cy="170" r="115" fill="white" />
        <circle cx="205" cy="150" r="105" fill="black" />
      </mask>
      <g mask={`url(#${cutId})`}>
        <rect width="320" height="320" fill={dark} />
      </g>
      <mask id={innerId} maskUnits="userSpaceOnUse">
        <rect width="320" height="320" fill="black" />
        <ellipse cx="195" cy="205" rx="78" ry="52" transform="rotate(-22 195 205)" fill="white" />
        <ellipse cx="170" cy="178" rx="78" ry="58" transform="rotate(-22 170 178)" fill="black" />
      </mask>
      <g mask={`url(#${innerId})`}>
        <rect width="320" height="320" fill={light} />
      </g>
      <path d="M256 60 L262 92 L294 98 L262 104 L256 136 L250 104 L218 98 L250 92 Z" fill={star} />
    </svg>
  );
}
