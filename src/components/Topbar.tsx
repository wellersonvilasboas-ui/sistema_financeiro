import React from 'react'
import { useAuth } from '../contexts/AuthContext'

interface TopbarProps {
  title: string
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { user } = useAuth()
  
  // Format current date to "Month Year" in Portuguese, e.g. "Maio 2026"
  const currentDateStr = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  })
  
  // Capitalize first letter of month and remove "de" (e.g. "maio de 2026" -> "Maio 2026")
  const formattedDate = currentDateStr.charAt(0).toUpperCase() + currentDateStr.slice(1).replace(' de ', ' ')

  // Dinâmico: Avatar do usuário (ou fallback premium padrão)
  const avatarUrl = user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'

  return (
    <header className="h-[56px] min-h-[56px] border-b border-[#E8E8EE] bg-white px-6 flex items-center justify-between z-10 w-full">
      <h1 className="text-base font-semibold text-[#111827]">{title}</h1>
      
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-[#534AB7] bg-[#EEEDFE] rounded-full">
          {formattedDate}
        </span>
        <img
          src={avatarUrl}
          alt={user?.email || 'User Avatar'}
          className="w-8 h-8 rounded-full object-cover border border-[#E8E8EE]"
        />
      </div>
    </header>
  )
}

export default Topbar
