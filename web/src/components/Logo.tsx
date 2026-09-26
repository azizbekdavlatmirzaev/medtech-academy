// CT gantry ring with an orbiting focal spot and a heartbeat line through it.
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="30" stroke="var(--teal)" strokeWidth="3" strokeDasharray="4 2" opacity="0.6" />
      <circle cx="40" cy="40" r="23" stroke="var(--teal)" strokeWidth="2.5" />
      <circle cx="40" cy="40" r="14" fill="var(--surface-2)" stroke="var(--teal)" strokeWidth="1.5" />
      <circle cx="56" cy="27" r="4.5" fill="var(--teal)" />
      <circle cx="56" cy="27" r="7.5" stroke="var(--teal)" strokeWidth="1" opacity="0.5" />
      <path
        d="M12 40 L26 40 L31 31 L37 49 L42 25 L47 48 L52 38 L58 40 L68 40"
        stroke="var(--teal)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="40" r="3" fill="var(--ink)" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-lg font-bold tracking-tight">
          MedTech <span className="font-semibold text-teal">Academy</span>
        </span>
        <span className="hidden whitespace-nowrap font-mono text-[10px] tracking-[0.15em] text-muted sm:block">KT SIMULYATORI &amp; AI TA’LIM</span>
      </span>
    </span>
  );
}
