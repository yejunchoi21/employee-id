import { useState, type FormEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './SiteHeader.css'

function SiteHeader() {
  const {
    membership,
    isAuthLoading,
    openIncomingCount,
    authError,
    login,
    logout,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setSigningIn(true)
    setLoginError(null)
    const result = await login(email, password)
    if (!result.ok) {
      setLoginError(result.error)
    } else {
      setPassword('')
    }
    setSigningIn(false)
  }

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
              ['site-header__link', isActive ? 'is-active' : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            Directory
          </NavLink>
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              ['site-header__link', isActive ? 'is-active' : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            Requests
            {membership && openIncomingCount > 0 ? (
              <span className="site-header__count" aria-label={`${openIncomingCount} open incoming requests`}>
                {openIncomingCount}
              </span>
            ) : null}
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

      <div className="site-header__auth">
        {isAuthLoading ? (
          <p className="site-header__auth-status">Checking session…</p>
        ) : membership ? (
          <div className="site-header__session">
            <p>
              Signed in as <strong>{membership.displayName}</strong>
              <span> ({membership.email})</span>
            </p>
            <button
              type="button"
              className="site-header__logout"
              onClick={() => {
                void logout()
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <form className="site-header__login" onSubmit={(event) => void handleLogin(event)}>
            <label>
              <span className="visually-hidden">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="Work email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={signingIn}
              />
            </label>
            <label>
              <span className="visually-hidden">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                disabled={signingIn}
              />
            </label>
            <button type="submit" disabled={signingIn}>
              {signingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
        {loginError || authError ? (
          <p className="site-header__auth-error" role="alert">
            {loginError ?? authError}
          </p>
        ) : null}
      </div>
    </header>
  )
}

export default SiteHeader
