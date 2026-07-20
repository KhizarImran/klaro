// Brand mark: blue tile + white trend line, matching /public/klaro-favicon.svg
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded bg-primary text-primary-foreground ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3/5 w-3/5"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    </span>
  )
}
