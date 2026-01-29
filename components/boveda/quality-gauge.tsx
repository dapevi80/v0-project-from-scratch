"use client"

interface QualityGaugeProps {
  quality: number
  size?: "sm" | "md" | "lg"
}

export function QualityGauge({ quality, size = "md" }: QualityGaugeProps) {
  // Normalizar calidad entre 0-100 y proteger contra NaN
  const safeQuality = typeof quality === 'number' && !isNaN(quality) ? quality : 0
  const normalizedQuality = Math.min(100, Math.max(0, Math.round(safeQuality)))
  
  // Determinar color basado en calidad
  const getColor = () => {
    if (normalizedQuality >= 95) return { stroke: "#22c55e", text: "text-green-600", bg: "bg-green-50" }
    if (normalizedQuality >= 80) return { stroke: "#eab308", text: "text-yellow-600", bg: "bg-yellow-50" }
    if (normalizedQuality >= 60) return { stroke: "#f97316", text: "text-orange-600", bg: "bg-orange-50" }
    return { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-50" }
  }
  
  const colors = getColor()
  
  // Tamaños
  const sizes = {
    sm: { width: 80, strokeWidth: 8, fontSize: "text-lg", labelSize: "text-[8px]" },
    md: { width: 120, strokeWidth: 10, fontSize: "text-2xl", labelSize: "text-[10px]" },
    lg: { width: 160, strokeWidth: 12, fontSize: "text-3xl", labelSize: "text-xs" },
  }
  
  const { width, strokeWidth, fontSize, labelSize } = sizes[size]
  const radius = (width - strokeWidth) / 2
  const circumference = radius * Math.PI // Solo medio círculo
  const offset = circumference - (normalizedQuality / 100) * circumference
  
  // Mensaje según calidad
  const getMessage = () => {
    if (normalizedQuality >= 95) return "Excelente"
    if (normalizedQuality >= 80) return "Buena"
    if (normalizedQuality >= 60) return "Regular"
    return "Baja"
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width / 2 + 20 }}>
        <svg
          width={width}
          height={width / 2 + 10}
          viewBox={`0 0 ${width} ${width / 2 + 10}`}
          className="transform"
        >
          {/* Fondo del arco */}
          <path
            d={`M ${strokeWidth / 2} ${width / 2} 
               A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${width / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Arco de progreso */}
          <path
            d={`M ${strokeWidth / 2} ${width / 2} 
               A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${width / 2}`}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          
          {/* Marcadores */}
          {[0, 25, 50, 75, 100].map((mark) => {
            const angle = (mark / 100) * Math.PI
            const x1 = width / 2 - (radius - strokeWidth / 2 - 2) * Math.cos(angle)
            const y1 = width / 2 - (radius - strokeWidth / 2 - 2) * Math.sin(angle)
            const x2 = width / 2 - (radius - strokeWidth / 2 - 8) * Math.cos(angle)
            const y2 = width / 2 - (radius - strokeWidth / 2 - 8) * Math.sin(angle)
            
            return (
              <line
                key={mark}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#9ca3af"
                strokeWidth={1}
              />
            )
          })}
        </svg>
        
        {/* Valor central */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-end pb-1"
          style={{ height: width / 2 + 10 }}
        >
          <span className={`${fontSize} font-bold ${colors.text}`}>
            {normalizedQuality}%
          </span>
          <span className={`${labelSize} text-muted-foreground font-medium`}>
            {getMessage()}
          </span>
        </div>
      </div>
      
      {/* Etiquetas */}
      <div className="flex justify-between w-full mt-1 px-2">
        <span className="text-[9px] text-muted-foreground">0</span>
        <span className="text-[9px] text-muted-foreground">100</span>
      </div>
    </div>
  )
}
