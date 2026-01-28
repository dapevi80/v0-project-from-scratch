'use client'

interface QualityGaugeProps {
  quality: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function QualityGauge({ quality, size = 'md', showLabel = true }: QualityGaugeProps) {
  const sizes = {
    sm: { width: 80, height: 50, stroke: 6, fontSize: 12 },
    md: { width: 120, height: 70, stroke: 8, fontSize: 16 },
    lg: { width: 160, height: 90, stroke: 10, fontSize: 20 },
  }
  
  const { width, height, stroke, fontSize } = sizes[size]
  const radius = (width - stroke) / 2
  const circumference = Math.PI * radius
  const progress = Math.min(100, Math.max(0, quality))
  const offset = circumference - (progress / 100) * circumference
  
  // Color based on quality
  const getColor = (q: number) => {
    if (q >= 95) return { main: '#22c55e', bg: '#dcfce7', text: 'Excelente' } // green
    if (q >= 80) return { main: '#eab308', bg: '#fef9c3', text: 'Buena' } // yellow
    if (q >= 60) return { main: '#f97316', bg: '#ffedd5', text: 'Regular' } // orange
    return { main: '#ef4444', bg: '#fee2e2', text: 'Baja' } // red
  }
  
  const color = getColor(progress)

  return (
    <div className="flex flex-col items-center">
      <svg 
        width={width} 
        height={height + 10}
        viewBox={`0 0 ${width} ${height + 10}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${stroke/2} ${height} A ${radius} ${radius} 0 0 1 ${width - stroke/2} ${height}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        <path
          d={`M ${stroke/2} ${height} A ${radius} ${radius} 0 0 1 ${width - stroke/2} ${height}`}
          fill="none"
          stroke={color.main}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
        
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = Math.PI - (tick / 100) * Math.PI
          const x1 = width/2 + (radius - stroke/2 - 4) * Math.cos(angle)
          const y1 = height - (radius - stroke/2 - 4) * Math.sin(angle)
          const x2 = width/2 + (radius - stroke/2 - 8) * Math.cos(angle)
          const y2 = height - (radius - stroke/2 - 8) * Math.sin(angle)
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#9ca3af"
              strokeWidth={1}
            />
          )
        })}
        
        {/* Needle */}
        {(() => {
          const angle = Math.PI - (progress / 100) * Math.PI
          const needleLength = radius - stroke - 8
          const x = width/2 + needleLength * Math.cos(angle)
          const y = height - needleLength * Math.sin(angle)
          return (
            <>
              <line
                x1={width/2}
                y1={height}
                x2={x}
                y2={y}
                stroke={color.main}
                strokeWidth={2}
                strokeLinecap="round"
                style={{ transition: 'all 0.5s ease-out' }}
              />
              <circle cx={width/2} cy={height} r={4} fill={color.main} />
            </>
          )
        })()}
        
        {/* Percentage text */}
        <text
          x={width/2}
          y={height - radius/2 + fontSize/2}
          textAnchor="middle"
          className="font-bold"
          style={{ fontSize: fontSize, fill: color.main }}
        >
          {Math.round(progress)}%
        </text>
      </svg>
      
      {showLabel && (
        <div 
          className="px-3 py-1 rounded-full text-xs font-medium mt-1"
          style={{ backgroundColor: color.bg, color: color.main }}
        >
          {color.text}
        </div>
      )}
    </div>
  )
}
