'use client'

import { Button } from '@/components/ui/button'

interface Option {
  value: string | number
  label: string
}

interface OptionChipsProps {
  options: Option[]
  value: string | number
  onChange: (value: string | number) => void
  label?: string
}

export function OptionChips({
  options,
  value,
  onChange,
  label,
}: OptionChipsProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
      )}
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
