import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Historico from './pages/Historico'
import Metas from './pages/Metas'
import Insights from './pages/Insights'
import Configuracoes from './pages/Configuracoes'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública de Login */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas (Sidebar + Topbar Grid Layout) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Fallback default redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
