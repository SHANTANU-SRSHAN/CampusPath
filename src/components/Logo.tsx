import { Link } from 'react-router-dom'

interface LogoProps {
  compact?: boolean
  className?: string
}

export function Logo({ compact = false, className = '' }: LogoProps) {
  return (
    <Link
      to="/"
      className={`logo ${className}`.trim()}
      aria-label="CampusPath home"
    >
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="presentation">
          <circle cx="9.5" cy="28" r="3.1" />
          <circle cx="20" cy="12" r="3.1" />
          <circle cx="30.5" cy="24" r="3.1" />
          <path d="M10 27L19 14M21.5 13.5L29 22" />
          <path className="logo-route" d="M10 28L20 12L30.5 24" />
        </svg>
      </span>
      <span className="logo-copy">
        <span className="logo-name">CampusPath</span>
        {!compact && <span className="logo-subline">Campus navigation lab</span>}
      </span>
    </Link>
  )
}
