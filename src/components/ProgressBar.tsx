import React from 'react'

interface ProgressBarProps {
  value: number // percentage between 0 and 100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const percentage = Math.max(0, Math.min(100, value))

  let barColor = 'bg-[#7F77DD]' // < 80% (purple)
  if (percentage >= 80 && percentage <= 90) {
    barColor = 'bg-[#F59E0B]' // 80% to 90% (amber)
  } else if (percentage > 90) {
    barColor = 'bg-[#EF4444]' // > 90% (red)
  }

  return (
    <div className="w-full bg-[#F3F4F6] rounded-full h-[5px] overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default ProgressBar
