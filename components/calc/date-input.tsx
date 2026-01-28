'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  max?: string
  min?: string
}

export function DateInput({
  value,
  onChange,
  label,
  max,
  min,
}: DateInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      )}
      
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        min={min}
        className="w-full text-center text-lg font-medium"
      />
    </div>
  )
}
