import React from 'react'
import { Plus } from 'lucide-react'

interface FABProps {
  onClick: () => void
}

export const FAB: React.FC<FABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-11 h-11 flex items-center justify-center bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[14px] shadow-lg shadow-[#7F77DD]/30 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer z-40"
      aria-label="Adicionar"
    >
      <Plus className="w-6 h-6" />
    </button>
  )
}

export default FAB
