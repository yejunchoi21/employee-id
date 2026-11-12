import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SiteHeader from './components/SiteHeader'
import { EmployeeDirectoryProvider } from './context/EmployeeDirectoryProvider'
import DirectoryPage from './pages/DirectoryPage'
import SignupPage from './pages/SignupPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <EmployeeDirectoryProvider>
        <div className="site">
          <div className="site__atmosphere" aria-hidden="true" />
          <SiteHeader />
          <Routes>
            <Route path="/" element={<Navigate to="/signup" replace />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="*" element={<Navigate to="/signup" replace />} />
          </Routes>
        </div>
      </EmployeeDirectoryProvider>
    </BrowserRouter>
  )
}

export default App
