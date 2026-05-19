import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCurrency, setCurrency } from '../utils/format'

interface TopbarProps {
  title: string
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { user } = useAuth()
  const [activeCurrency, setActiveCurrency] = useState(getCurrency())
  
  // Format current date to "Month Year" in Portuguese, e.g. "Maio 2026"
  const currentDateStr = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  })
  
  // Capitalize first letter of month and remove "de" (e.g. "maio de 2026" -> "Maio 2026")
  const formattedDate = currentDateStr.charAt(0).toUpperCase() + currentDateStr.slice(1).replace(' de ', ' ')

  // Dinâmico: Avatar do usuário (ou fallback premium padrão)
  const avatarUrl = user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value as 'BRL' | 'USD'
    setActiveCurrency(newCurrency)
    setCurrency(newCurrency)
    window.location.reload() // Recarrega para aplicar a moeda globalmente
  }

  return (
    <header className="h-[56px] min-h-[56px] border-b border-[#E8E8EE] bg-white px-4 md:px-6 flex items-center justify-between z-10 w-full">
      <h1 className="text-[15px] md:text-base font-semibold text-[#111827] truncate pr-2">{title}</h1>
      
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Seletor de Moeda Premium */}
        <div className="relative flex items-center">
          <select
            value={activeCurrency}
            onChange={handleCurrencyChange}
            className="appearance-none bg-[#F4F5F7]/80 hover:bg-[#E8E8EE]/80 px-2.5 py-1.5 pr-7 border border-[#E8E8EE] rounded-full text-[11px] font-semibold text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
          >
            <option value="BRL">🇧🇷 BRL</option>
            <option value="USD">🇺🇸 USD</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#9CA3AF]">
            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-semibold text-[#534AB7] bg-[#EEEDFE] rounded-full">
          {formattedDate}
        </span>
        <img
          src={avatarUrl}
          alt={user?.email || 'User Avatar'}
          className="w-7 h-7 md:w-8 md:w-8 rounded-full object-cover border border-[#E8E8EE]"
        />
      </div>
    </header>
  )
}

export default Topbar
