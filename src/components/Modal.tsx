import React from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-md bg-white border border-[#E8E8EE] rounded-[14px] shadow-2xl p-6 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-bold text-[#111827] mb-2">{title}</h3>
        <p className="text-sm text-[#9CA3AF] mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[#E8E8EE] text-[#6B7280] hover:bg-[#F4F5F7] rounded-[999px] text-sm font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#7F77DD] text-white hover:bg-[#534AB7] rounded-[999px] text-sm font-medium transition-colors shadow-sm shadow-[#7F77DD]/20 cursor-pointer"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
