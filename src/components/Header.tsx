import { useEffect, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { Logo } from './Logo'

const navItems = [
  { label: 'Home', to: '/', end: true },
  { label: 'Campus Map', to: '/map' },
  { label: 'Find Shortest Path', to: '/find-path' },
  { label: 'Algorithm Visualization', to: '/algorithm' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <NavLink to="/find-path" className="button button-primary header-cta">
            Find a Route
            <ArrowUpRight size={15} aria-hidden="true" />
          </NavLink>
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <div
        id="mobile-navigation"
        className={`mobile-nav ${menuOpen ? 'open' : ''}`}
        hidden={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/find-path" className="button button-primary mobile-cta">
          Find a Route
          <ArrowUpRight size={16} aria-hidden="true" />
        </NavLink>
      </div>
    </header>
  )
}
