'use client'

import { Slider } from '@/components/ui/slider'
import { formatMXN } from '@/lib/constants/lft'

interface MoneySliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  step?: number
}

export function MoneySlider({
  value,
  onChange,
  min = 0,
  max = 500000,
  label,
  step = 1,
}: MoneySliderProps) {
  return (
    <div className="space-y-4">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
      )}
      
      {/* Valor principal */}
      <div className="text-center">
        <span className="text-3xl font-bold text-primary">
          {formatMXN(value)}
        </span>
      </div>
      
      {/* Slider */}
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>
      
      {/* Labels min/max */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>{formatMXN(min)}</span>
        <span>{formatMXN(max)}</span>
      </div>
    </div>
  )
}
