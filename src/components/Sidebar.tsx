import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutGrid, 
  LineChart, 
  Target, 
  Settings, 
  LogOut 
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: LayoutGrid,
      iconBg: 'bg-[#EEEDFE]',
      iconColor: 'text-[#7F77DD]'
    },
    {
      path: '/historico',
      label: 'Histórico',
      icon: LineChart,
      iconBg: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]'
    },
    {
      path: '/metas',
      label: 'Metas',
      icon: Target,
      iconBg: 'bg-[#DCFCE7]',
      iconColor: 'text-[#16A34A]'
    },
    {
      path: '/configuracoes',
      label: 'Configurações',
      icon: Settings,
      iconBg: 'bg-[#FEE2E2]',
      iconColor: 'text-[#DC2626]'
    }
  ]

  const currentPath = location.pathname

  // Extract name from email as fallback
  const username = user?.email ? user.email.split('@')[0] : 'Usuário'
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1)

  // Dinâmico: Avatar do usuário (ou fallback premium padrão)
  const avatarUrl = user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'

  return (
    <aside className="fixed bottom-0 left-0 right-0 h-16 w-full flex flex-row border-t border-[#E8E8EE] bg-[#1E1B4B] select-none shrink-0 z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:h-screen md:w-auto md:flex-row md:border-r md:border-t-0 md:bg-transparent">
      {/* COLUNA 1: Rail de ícones (64px no desktop, 100% de largura no mobile) */}
      <div className="w-full h-full flex flex-row items-center justify-around px-2 md:w-[64px] md:h-full md:flex-col md:py-6 md:px-0 md:justify-between bg-[#1E1B4B]">
        <div className="flex flex-row md:flex-col items-center justify-around w-full md:w-auto gap-1 md:gap-6">
          {/* Logo "F" em box roxo (oculto no mobile) */}
          <div className="hidden md:flex w-10 h-10 bg-[#7F77DD] rounded-[10px] items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-[#7F77DD]/20">
            F
          </div>

          {/* Ícones de Navegação do Rail */}
          <nav className="flex flex-row md:flex-col items-center justify-around md:gap-3 gap-2 w-full md:w-auto px-1 md:px-2">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-[#7F77DD] text-white shadow-md shadow-[#7F77DD]/20' 
                      : 'text-[#9CA3AF] hover:text-white hover:bg-white/10'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              )
            })}

            {/* Botão de Logout no mobile (oculto no desktop) */}
            <button
              onClick={logout}
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] hover:bg-white/5 transition-all duration-200 cursor-pointer md:hidden"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        </div>

        {/* Botão de Logout no desktop (oculto no mobile) */}
        <button
          onClick={logout}
          className="hidden md:flex w-10 h-10 rounded-[10px] items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] hover:bg-white/5 transition-all duration-200 cursor-pointer"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* COLUNA 2: Painel lateral branco (220px - oculto no mobile) */}
      <div className="hidden md:flex w-[220px] bg-white flex-col justify-between py-6 px-4">
        <div className="flex flex-col gap-6">
          {/* Foto + Nome do Usuário */}
          <div className="flex items-center gap-3 border-b border-[#E8E8EE] pb-4">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-[#E8E8EE]"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-[#111827] truncate">
                {capitalizedUsername}
              </span>
              <span className="text-xs text-[#9CA3AF] font-medium">
                conta pessoal
              </span>
            </div>
          </div>

          {/* Menu de Navegação */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-left transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-[#EEEDFE] text-[#534AB7] font-semibold' 
                      : 'text-[#111827] hover:bg-[#F4F5F7]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer discreto do painel */}
        <div className="text-[11px] text-[#9CA3AF] text-center font-mono">
          v1.0.0-mock
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
