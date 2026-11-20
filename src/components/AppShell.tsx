import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import CloseIcon from '@mui/icons-material/Close'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MenuIcon from '@mui/icons-material/Menu'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined'
import { useAuth } from '../hooks/useAuth'
import { drawerWidth } from '../theme/northlineTheme'

const PAGE_TITLES: Array<{ match: RegExp; title: string }> = [
  { match: /^\/directory/, title: 'Directory' },
  { match: /^\/requests/, title: 'Help Requests' },
  { match: /^\/admin\/equipment/, title: 'Equipment inventory' },
  { match: /^\/equipment/, title: 'Equipment' },
  { match: /^\/onboarding\/team/, title: 'Team onboarding' },
  { match: /^\/admin\/onboarding/, title: 'Onboarding admin' },
  { match: /^\/onboarding/, title: 'Onboarding' },
  { match: /^\/admin\/accounts/, title: 'Employee accounts' },
  { match: /^\/signup/, title: 'Add employee' },
]

function titleForPath(pathname: string) {
  return PAGE_TITLES.find((entry) => entry.match.test(pathname))?.title ?? 'Northline'
}

function AppShell() {
  const location = useLocation()
  const {
    membership,
    isAuthLoading,
    openIncomingCount,
    authError,
    login,
    logout,
  } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const pageTitle = useMemo(
    () => titleForPath(location.pathname),
    [location.pathname],
  )
  const isAdmin = membership?.role === 'admin'
  const accountOpen = Boolean(accountAnchor)

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setSigningIn(true)
    setLoginError(null)
    const result = await login(email, password)
    if (!result.ok) {
      setLoginError(result.error)
    } else {
      setPassword('')
      setAccountAnchor(null)
    }
    setSigningIn(false)
  }

  const closeMobile = () => setMobileOpen(false)

  const navItem = (
    to: string,
    label: string,
    icon: ReactNode,
    options?: { end?: boolean; badge?: number },
  ) => (
    <ListItemButton
      key={to}
      component={NavLink}
      to={to}
      end={options?.end}
      onClick={closeMobile}
      sx={{
        borderRadius: 1,
        mb: 0.25,
        '&.active': {
          bgcolor: 'rgba(15, 76, 129, 0.1)',
          color: 'primary.dark',
          '& .MuiListItemIcon-root': { color: 'primary.dark' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
        }
      />
      {options?.badge && options.badge > 0 ? (
        <Badge badgeContent={options.badge} color="primary" />
      ) : null}
    </ListItemButton>
  )

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Toolbar sx={{ gap: 1.25, px: 2, minHeight: 64 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontFamily: '"Bebas Neue", "Arial Narrow", Impact, sans-serif',
            fontSize: '1.1rem',
          }}
          component={RouterLink}
          to="/directory"
          onClick={closeMobile}
        >
          N
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            component={RouterLink}
            to="/directory"
            onClick={closeMobile}
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              fontFamily: '"Bebas Neue", "Arial Narrow", Impact, sans-serif',
              letterSpacing: '0.06em',
              fontSize: '1.05rem',
              lineHeight: 1,
              display: 'block',
            }}
          >
            Northline
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Employee ID
          </Typography>
        </Box>
        <IconButton
          onClick={closeMobile}
          sx={{ display: { md: 'none' } }}
          aria-label="Close navigation"
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.25, py: 1.5 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 1, display: 'block' }}
        >
          Workspace
        </Typography>
        <List dense disablePadding>
          {navItem('/directory', 'Directory', <GroupOutlinedIcon fontSize="small" />)}
          {navItem(
            '/requests',
            'Help Requests',
            <HelpOutlineOutlinedIcon fontSize="small" />,
            { badge: membership ? openIncomingCount : 0 },
          )}
          {membership
            ? navItem(
                '/equipment',
                'Equipment',
                <DevicesOutlinedIcon fontSize="small" />,
              )
            : null}
          {membership
            ? navItem(
                '/onboarding',
                'Onboarding',
                <SchoolOutlinedIcon fontSize="small" />,
                { end: true },
              )
            : null}
          {membership
            ? navItem(
                '/onboarding/team',
                'Team onboarding',
                <SupervisorAccountOutlinedIcon fontSize="small" />,
              )
            : null}
        </List>

        {isAdmin ? (
          <>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ px: 1, mt: 1.5, display: 'block' }}
            >
              Administration
            </Typography>
            <List dense disablePadding>
              {navItem(
                '/admin/equipment',
                'Equipment inventory',
                <Inventory2OutlinedIcon fontSize="small" />,
              )}
              {navItem(
                '/admin/onboarding',
                'Onboarding admin',
                <AdminPanelSettingsOutlinedIcon fontSize="small" />,
              )}
              {navItem(
                '/admin/accounts',
                'Employee accounts',
                <PersonAddAltOutlinedIcon fontSize="small" />,
              )}
              {navItem(
                '/signup',
                'Add employee',
                <PersonAddAltOutlinedIcon fontSize="small" />,
              )}
            </List>
          </>
        ) : null}
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        {isAuthLoading ? (
          <Typography variant="body2" color="text.secondary">
            Checking session…
          </Typography>
        ) : membership ? (
          <Stack spacing={1.25}>
            <Box>
              <Typography variant="subtitle2" color="text.primary">
                {membership.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {membership.email}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  display: 'inline-block',
                  px: 0.75,
                  py: 0.15,
                  borderRadius: 999,
                  bgcolor: 'grey.200',
                  textTransform: 'capitalize',
                }}
              >
                {membership.role}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                void logout()
              }}
            >
              Sign out
            </Button>
          </Stack>
        ) : (
          <Box
            component="form"
            onSubmit={(event) => void handleLogin(event)}
            sx={{ display: 'grid', gap: 1.25 }}
          >
            <Typography variant="subtitle2">Sign in</Typography>
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={signingIn}
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              slotProps={{ htmlInput: {  minLength: 8  } }}
              disabled={signingIn}
            />
            <Button type="submit" variant="contained" disabled={signingIn}>
              {signingIn ? 'Signing in…' : 'Sign in'}
            </Button>
            {loginError || authError ? (
              <Typography variant="body2" color="error" role="alert">
                {loginError ?? authError}
              </Typography>
            ) : null}
          </Box>
        )}
      </Box>
    </Box>
  )

  return (
    <>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: 12,
          top: 12,
          zIndex: (theme) => theme.zIndex.tooltip + 1,
          transform: 'translateY(-200%)',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 1.5,
          py: 1,
          borderRadius: 1,
          textDecoration: 'none',
          fontWeight: 600,
          '&:focus': { transform: 'translateY(0)' },
        }}
      >
        Skip to content
      </Box>

      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56, gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ flex: 1 }} noWrap>
            {pageTitle}
          </Typography>
          <Button
            color="inherit"
            startIcon={<AccountCircleOutlinedIcon />}
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={accountOpen}
          >
            {membership ? membership.displayName : 'Account'}
          </Button>
          <Menu
            anchorEl={accountAnchor}
            open={accountOpen}
            onClose={() => setAccountAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {membership ? (
              <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
                <Typography variant="subtitle2">{membership.displayName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {membership.email}
                </Typography>
                <Button
                  fullWidth
                  sx={{ mt: 1.25 }}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setAccountAnchor(null)
                    void logout()
                  }}
                >
                  Sign out
                </Button>
              </Box>
            ) : (
              <MenuItem disabled>
                Use the sidebar sign-in form to access your account.
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="Application"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  )
}

export default AppShell
