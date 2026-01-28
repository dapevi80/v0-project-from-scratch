'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string // "HH:MM" format
  onChange: (value: string) => void
  label?: string
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minutes = ['00', '15', '30', '45']

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [hour, minute] = value.split(':')
  const [showPicker, setShowPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Scroll to selected values when picker opens
  useEffect(() => {
    if (showPicker) {
      const hourIndex = hours.indexOf(hour)
      const minuteIndex = minutes.indexOf(minute) !== -1 ? minutes.indexOf(minute) : 0
      
      if (hourRef.current) {
        hourRef.current.scrollTop = hourIndex * 40 - 40
      }
      if (minuteRef.current) {
        minuteRef.current.scrollTop = minuteIndex * 40 - 40
      }
    }
  }, [showPicker, hour, minute])
  
  const handleHourSelect = (h: string) => {
    onChange(`${h}:${minute}`)
  }
  
  const handleMinuteSelect = (m: string) => {
    onChange(`${hour}:${m}`)
  }
  
  const formatTime = (h: string, m: string) => {
    const hourNum = parseInt(h, 10)
    const period = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${m} ${period}`
  }

  return (
    <div ref={containerRef} className="relative">
      {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          "w-full flex items-center justify-center gap-1 p-2 rounded-lg border bg-background text-lg font-mono font-semibold",
          "hover:border-primary/50 transition-colors",
          showPicker && "border-primary ring-2 ring-primary/20"
        )}
      >
        <span className="text-primary">{hour}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-primary">{minute}</span>
        <span className="text-xs text-muted-foreground ml-1">
          {parseInt(hour, 10) >= 12 ? 'PM' : 'AM'}
        </span>
      </button>
      
      {showPicker && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border rounded-lg shadow-lg p-2">
          <div className="flex gap-2">
            {/* Hours */}
            <div className="flex-1">
              <p className="text-xs text-center text-muted-foreground mb-1">Hora</p>
              <div 
                ref={hourRef}
                className="h-[120px] overflow-y-auto scrollbar-thin"
              >
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={cn(
                      "w-full h-10 flex items-center justify-center text-lg font-mono rounded transition-colors",
                      h === hour 
                        ? "bg-primary text-primary-foreground font-bold" 
                        : "hover:bg-muted"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Minutes */}
            <div className="flex-1">
              <p className="text-xs text-center text-muted-foreground mb-1">Min</p>
              <div 
                ref={minuteRef}
                className="h-[120px] overflow-y-auto scrollbar-thin"
              >
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={cn(
                      "w-full h-10 flex items-center justify-center text-lg font-mono rounded transition-colors",
                      m === minute 
                        ? "bg-primary text-primary-foreground font-bold" 
                        : "hover:bg-muted"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="w-full mt-2 p-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Listo
          </button>
        </div>
      )}
    </div>
  )
}
