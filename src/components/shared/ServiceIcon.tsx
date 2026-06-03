import React from 'react'
import { 
  Scissors, 
  Sparkles, 
  Wind, 
  Flame, 
  Crown, 
  Palette, 
  Sparkle, 
  RefreshCw
} from 'lucide-react'

interface ServiceIconProps {
  icon: string
  className?: string
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ icon, className = "w-8 h-8" }) => {
  const getIconComponent = () => {
    switch (icon) {
      case '✂️':
        return Scissors
      case '🪒':
        return Sparkles
      case '💈':
        return RefreshCw
      case '🌿':
        return Sparkles
      case '✨':
        return Sparkles
      case '💨':
        return Wind
      case '🕯️':
        return Flame
      case '🌀':
        return Sparkle
      case '👑':
        return Crown
      case '🎨':
        return Palette
      default:
        return Scissors
    }
  }

  const IconComponent = getIconComponent()

  return (
    <IconComponent 
      className={`${className} text-yellow-400 filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]`} 
    />
  )
}
