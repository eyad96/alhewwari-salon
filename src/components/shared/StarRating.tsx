import React from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
}) => {
  const [hovered, setHovered] = React.useState(0)

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }

  const displayed = interactive && hovered ? hovered : rating

  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            className={`${sizes[size]} transition-colors ${
              star <= displayed
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-700 text-gray-700'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default StarRating
