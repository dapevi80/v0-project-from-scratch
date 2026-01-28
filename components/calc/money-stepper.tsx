'use client'

import { Button } from '@/components/ui/button'
import { formatMXN } from '@/lib/constants/lft'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'

interface MoneyStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  steps?: number[]
}

export function MoneyStepper({
  value,
  onChange,
  min = 0,
  max = 100000,
  label,
  steps = [50, 100, 500, 1000],
}: MoneyStepperProps) {
  const [currentStep, setCurrentStep] = useState(steps[1] || 100)

  const increment = () => {
    const newValue = Math.min(value + currentStep, max)
    onChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(value - currentStep, min)
    onChange(newValue)
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
      )}
      
      {/* Valor principal */}
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 bg-transparent"
          onClick={decrement}
          disabled={value <= min}
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        <div className="min-w-[180px] text-center">
          <span className="text-3xl font-bold text-primary">
            {formatMXN(value)}
          </span>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 bg-transparent"
          onClick={increment}
          disabled={value >= max}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Selector de paso */}
      <div className="flex justify-center gap-2">
        <span className="text-xs text-muted-foreground self-center mr-2">Paso:</span>
        {steps.map((step) => (
          <Button
            key={step}
            type="button"
            variant={currentStep === step ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setCurrentStep(step)}
          >
            ${step}
          </Button>
        ))}
      </div>
    </div>
  )
}
