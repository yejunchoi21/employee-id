import { Box } from '@mui/material'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ChangePasswordDialog from './components/ChangePasswordDialog'
import { AuthProvider } from './context/AuthProvider'
import { EmployeeDirectoryProvider } from './context/EmployeeDirectoryProvider'
import AdminCreateAccountPage from './pages/AdminCreateAccountPage'
import AdminEquipmentPage from './pages/AdminEquipmentPage'
import AdminOnboardingPage from './pages/AdminOnboardingPage'
import DirectoryPage from './pages/DirectoryPage'
import EquipmentPage from './pages/EquipmentPage'
import MyOnboardingPage from './pages/MyOnboardingPage'
import RequestsPage from './pages/RequestsPage'
import SignupPage from './pages/SignupPage'
import TeamOnboardingPage from './pages/TeamOnboardingPage'
import { drawerWidth } from './theme/northlineTheme'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EmployeeDirectoryProvider>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppShell />
            <Box
              component="main"
              id="main-content"
              sx={{
                flexGrow: 1,
                width: { md: `calc(100% - ${drawerWidth}px)` },
                ml: { md: `${drawerWidth}px` },
                pt: { xs: 7, sm: 8 },
                px: { xs: 1.5, sm: 2.5 },
                pb: 3,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <Box sx={{ maxWidth: 1152, mx: 'auto', width: '100%' }}>
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="/directory" replace />}
                  />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/directory" element={<DirectoryPage />} />
                  <Route path="/requests" element={<RequestsPage />} />
                  <Route path="/equipment" element={<EquipmentPage />} />
                  <Route
                    path="/admin/equipment"
                    element={<AdminEquipmentPage />}
                  />
                  <Route path="/onboarding" element={<MyOnboardingPage />} />
                  <Route
                    path="/onboarding/team"
                    element={<TeamOnboardingPage />}
                  />
                  <Route
                    path="/admin/onboarding"
                    element={<AdminOnboardingPage />}
                  />
                  <Route
                    path="/admin/accounts"
                    element={<AdminCreateAccountPage />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/directory" replace />}
                  />
                </Routes>
              </Box>
            </Box>
            <ChangePasswordDialog />
          </Box>
        </EmployeeDirectoryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
