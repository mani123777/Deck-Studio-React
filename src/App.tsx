import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { PresentationPage } from './pages/PresentationPage'
import { GeneratePage } from './pages/GeneratePage'
import { CreatePage } from './pages/CreatePage'
import { AuthGuard } from './components/Auth/AuthGuard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={<AuthGuard><DashboardPage /></AuthGuard>}
        />
        <Route
          path="/create"
          element={<AuthGuard><CreatePage /></AuthGuard>}
        />
        <Route
          path="/templates"
          element={<AuthGuard><TemplatesPage /></AuthGuard>}
        />
        <Route
          path="/presentations/:id"
          element={<AuthGuard><PresentationPage /></AuthGuard>}
        />
        <Route
          path="/generate/:jobId"
          element={<AuthGuard><GeneratePage /></AuthGuard>}
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
