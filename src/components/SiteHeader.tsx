import { NavLink } from 'react-router-dom'
import './SiteHeader.css'

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/directory" className="site-header__brand">
          <span className="site-header__mark" aria-hidden="true">
            N
          </span>
          <span className="site-header__brand-text">
            <span className="site-header__eyebrow">Northline Collective</span>
            <span className="site-header__product">Employee ID</span>
          </span>
        </NavLink>

        <nav className="site-header__nav" aria-label="Primary">
          <NavLink
            to="/directory"
            className={({ isActive }) =>
              [
                'site-header__link',
                isActive ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            Directory
          </NavLink>
          <NavLink
            to="/signup"
            className={({ isActive }) =>
              [
                'site-header__link',
                'site-header__link--accent',
                isActive ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            Add employee
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
