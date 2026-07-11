/** Moonshot brand mark: a two-tone crescent moon with a sparkle star.
 *  Self-coloured (navy + periwinkle) so it reads on a light tile in either theme. */
export function MoonLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <mask id="moonshot-moon-outer">
          <rect width="32" height="32" fill="black" />
          <circle cx="15" cy="17" r="12" fill="white" />
          <circle cx="20.5" cy="12.5" r="11.5" fill="black" />
        </mask>
        <mask id="moonshot-moon-inner">
          <rect width="32" height="32" fill="black" />
          <circle cx="18" cy="18.5" r="9" fill="white" />
          <circle cx="13.5" cy="13.5" r="9.5" fill="black" />
        </mask>
      </defs>
      <circle cx="15" cy="17" r="12" fill="#1e2b4d" mask="url(#moonshot-moon-outer)" />
      <circle cx="18" cy="18.5" r="9" fill="#b9c6e2" mask="url(#moonshot-moon-inner)" />
      <path
        d="M25 2.5 C25.4 6 26 6.6 29.5 7 C26 7.4 25.4 8 25 11.5 C24.6 8 24 7.4 20.5 7 C24 6.6 24.6 6 25 2.5 Z"
        fill="#1e2b4d"
      />
    </svg>
  );
}
