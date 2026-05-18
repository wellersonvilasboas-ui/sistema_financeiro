import React from 'react'

interface BadgeProps {
  variant: 'whatsapp' | 'manual'
  children?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  const styles = {
    whatsapp: 'bg-[#DCFCE7] text-[#15803D]',
    manual: 'bg-[#F4F5F7] text-[#6B7280]'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${styles[variant]}`}>
      {children || (variant === 'whatsapp' ? 'WhatsApp' : 'Manual')}
    </span>
  )
}

export default Badge
