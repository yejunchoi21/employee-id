import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import App from './App.tsx'
import { northlineTheme } from './theme/northlineTheme'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={northlineTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
