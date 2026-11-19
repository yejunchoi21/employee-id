import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ChangePasswordDialog from './components/ChangePasswordDialog'
import SiteHeader from './components/SiteHeader'
import { AuthProvider } from './context/AuthProvider'
import { EmployeeDirectoryProvider } from './context/EmployeeDirectoryProvider'
import AdminCreateAccountPage from './pages/AdminCreateAccountPage'
import AdminOnboardingPage from './pages/AdminOnboardingPage'
import DirectoryPage from './pages/DirectoryPage'
import MyOnboardingPage from './pages/MyOnboardingPage'
import RequestsPage from './pages/RequestsPage'
import SignupPage from './pages/SignupPage'
import TeamOnboardingPage from './pages/TeamOnboardingPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EmployeeDirectoryProvider>
          <div className="site">
            <div className="site__atmosphere" aria-hidden="true" />
            <SiteHeader />
            <Routes>
              <Route path="/" element={<Navigate to="/signup" replace />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/onboarding" element={<MyOnboardingPage />} />
              <Route path="/onboarding/team" element={<TeamOnboardingPage />} />
              <Route
                path="/admin/onboarding"
                element={<AdminOnboardingPage />}
              />
              <Route
                path="/admin/accounts"
                element={<AdminCreateAccountPage />}
              />
              <Route path="*" element={<Navigate to="/signup" replace />} />
            </Routes>
            <ChangePasswordDialog />
          </div>
        </EmployeeDirectoryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
