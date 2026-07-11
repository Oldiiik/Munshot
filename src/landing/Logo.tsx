/**
 * Moonshot mark — a crescent moon with a sparkle, recreated as an inline SVG so
 * it inherits `currentColor` (light on the dark theme, indigo on Edu) and stays
 * crisp at any size. Matches the provided brand logo's shape.
 */
export function Logo({ className }: { className?: string }) {
  const maskId = "moon-cut";
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id={maskId}>
          <rect width="32" height="32" fill="black" />
          {/* full disc … */}
          <circle cx="14.5" cy="17" r="11.5" fill="white" />
          {/* … minus an offset disc → leaves the crescent */}
          <circle cx="21.5" cy="13.5" r="11" fill="black" />
        </mask>
      </defs>

      <g fill="currentColor">
        <path d="M14.5 5.5 A11.5 11.5 0 1 0 14.5 28.5 A11.5 11.5 0 1 0 14.5 5.5Z" mask={`url(#${maskId})`} />
        {/* sparkle */}
        <path d="M25 3 Q25 7 29 7 Q25 7 25 11 Q25 7 21 7 Q25 7 25 3Z" />
      </g>
    </svg>
  );
}
