import { createTheme } from '@mui/material/styles'

const navy = '#0f4c81'
const navyDeep = '#0a355a'
const ink = '#0b1220'
const muted = '#64748b'
const page = '#f1f5f9'
const line = '#e2e8f0'

export const drawerWidth = 248

export const northlineTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: navy,
      dark: navyDeep,
      light: '#2a6fa8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#475569',
      contrastText: '#ffffff',
    },
    background: {
      default: page,
      paper: '#ffffff',
    },
    text: {
      primary: ink,
      secondary: muted,
    },
    divider: line,
    success: { main: '#166534' },
    warning: { main: '#92400e' },
    error: { main: '#b42318' },
    info: { main: '#075985' },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.15rem', fontWeight: 600 },
    h3: { fontSize: '1rem', fontWeight: 600 },
    h4: { fontSize: '0.95rem', fontWeight: 600 },
    h5: { fontSize: '0.9rem', fontWeight: 600 },
    h6: { fontSize: '0.85rem', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, color: muted },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.85rem', color: muted },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: {
      fontSize: '0.7rem',
      fontWeight: 650,
      letterSpacing: '0.06em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
    '0 4px 12px rgba(15, 23, 42, 0.06)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
    '0 8px 20px rgba(15, 23, 42, 0.08)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: page,
          color: ink,
        },
        '#root': {
          minHeight: '100vh',
        },
        '::selection': {
          background: 'rgba(42, 164, 216, 0.28)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 36,
          borderRadius: 6,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        fullWidth: true,
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${line}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: 'inherit',
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${line}`,
          backgroundColor: '#ffffff',
          color: ink,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${line}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 40,
          fontWeight: 600,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 650,
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
})
