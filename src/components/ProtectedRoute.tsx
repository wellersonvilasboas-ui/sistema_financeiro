import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center font-sans">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#7F77DD]/20 border-t-[#7F77DD] rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-[#9CA3AF] text-sm font-medium tracking-wide animate-pulse">
          Carregando painel financeiro...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F5F7] font-sans antialiased">
      {/* Coluna 1 & Coluna 2: Sidebar (64px + 220px) */}
      <Sidebar />

      {/* Coluna 3: Topbar + Área de conteúdo scrollável */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </div>
    </div>
  )
}

export default ProtectedRoute
