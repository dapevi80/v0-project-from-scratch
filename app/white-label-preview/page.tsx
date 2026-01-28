"use client"

import { useState } from "react"
import { 
  Calculator, FileText, Briefcase, Scale, Shield, 
  Upload, ChevronRight, Bell, Menu, User, Home,
  Clock, CheckCircle2, AlertCircle, TrendingUp,
  Building2, Calendar, DollarSign, Star, Sparkles,
  Check, ArrowRight, Zap, Users, Award, Lock,
  Phone, Mail, Globe, Play, Pause, ChevronDown
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// Temas disponibles para white-label
const THEMES = {
  ppAbogados: {
    id: "clasico",
    name: "Clasico Dorado",
    description: "Elegante y tradicional",
    primary: "#B8860B",
    primaryLight: "#D4A84B",
    primaryDark: "#8B6914",
    secondary: "#1a1a2e",
    accent: "#C9A227",
    background: "#FAFAF8",
    cardBg: "#FFFFFF",
    textPrimary: "#1a1a2e",
    textSecondary: "#64748b",
    gradient: "from-amber-600 via-yellow-600 to-amber-700",
    style: "elegant"
  },
  ppModerno: {
    id: "navy",
    name: "Moderno Navy",
    description: "Profesional y contemporaneo",
    primary: "#1e3a5f",
    primaryLight: "#2d4a6f",
    primaryDark: "#0f2a4f",
    secondary: "#C9A227",
    accent: "#B8860B",
    background: "#F8FAFC",
    cardBg: "#FFFFFF",
    textPrimary: "#1e3a5f",
    textSecondary: "#64748b",
    gradient: "from-slate-800 via-slate-700 to-slate-900",
    style: "modern"
  },
  ppMinimalista: {
    id: "minimal",
    name: "Minimalista",
    description: "Limpio y enfocado",
    primary: "#2C3E50",
    primaryLight: "#34495E",
    primaryDark: "#1a252f",
    secondary: "#D4AF37",
    accent: "#E8D5B7",
    background: "#FFFFFF",
    cardBg: "#F9FAFB",
    textPrimary: "#2C3E50",
    textSecondary: "#7f8c8d",
    gradient: "from-gray-800 via-gray-700 to-gray-900",
    style: "minimal"
  },
  ppLujo: {
    id: "luxury",
    name: "Lujo Premium",
    description: "Exclusivo y sofisticado",
    primary: "#0D0D0D",
    primaryLight: "#1a1a1a",
    primaryDark: "#000000",
    secondary: "#D4AF37",
    accent: "#C9A227",
    background: "#0D0D0D",
    cardBg: "#1a1a1a",
    textPrimary: "#FFFFFF",
    textSecondary: "#9CA3AF",
    gradient: "from-black via-gray-900 to-black",
    style: "luxury"
  }
}

type ThemeKey = keyof typeof THEMES
type LogoVariant = "original" | "balanza" | "escudo" | "geometrico" | "elegante"

const LOGO_VARIANTS = {
  original: { name: "Logo Original", description: "Tu logo actual sin modificaciones" },
  balanza: { name: "Balanza Central", description: "Balanza de justicia integrada entre las P" },
  escudo: { name: "Escudo Protector", description: "Ampersand dentro de un escudo de proteccion" },
  geometrico: { name: "Geometrico Moderno", description: "Formas geometricas limpias y contemporaneas" },
  elegante: { name: "Elegante Clasico", description: "Tipografia italica con lineas decorativas" }
}

// Componente SVG del Logo segun variante
function LogoSVG({ variant, color, size = "md" }: { variant: LogoVariant; color: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: { height: "h-8", viewBox: "0 0 140 45" },
    md: { height: "h-12", viewBox: "0 0 140 45" },
    lg: { height: "h-16", viewBox: "0 0 160 50" },
    xl: { height: "h-24", viewBox: "0 0 180 60" }
  }
  
  const s = sizes[size]
  
  if (variant === "original") {
    return (
      <div className={`${s.height} flex items-center`}>
        <img 
          src="/images/pp-abogados-logo.png" 
          alt="P&P Abogados"
          className={`${s.height} object-contain`}
        />
      </div>
    )
  }
  
  if (variant === "balanza") {
    return (
      <svg viewBox="0 0 160 50" className={`${s.height} w-auto`}>
        <text x="8" y="38" fill={color} fontFamily="Georgia, serif" fontSize="38" fontWeight="bold">P</text>
        <g transform="translate(48, 6)">
          <line x1="16" y1="2" x2="16" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="2" y1="8" x2="30" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M2 10 Q2 18 8 18 Q14 18 14 10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M18 10 Q18 18 24 18 Q30 18 30 10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M10 40 L22 40 L16 36 Z" fill={color} />
        </g>
        <text x="95" y="38" fill={color} fontFamily="Georgia, serif" fontSize="38" fontWeight="bold">P</text>
      </svg>
    )
  }
  
  if (variant === "escudo") {
    return (
      <svg viewBox="0 0 160 50" className={`${s.height} w-auto`}>
        <text x="10" y="38" fill={color} fontFamily="Georgia, serif" fontSize="38" fontWeight="bold">P</text>
        <g transform="translate(52, 3)">
          <path 
            d="M16 0 L32 6 L32 28 L16 38 L0 28 L0 6 Z" 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <text x="8" y="26" fill={color} fontFamily="Georgia, serif" fontSize="20" fontWeight="bold">&</text>
        </g>
        <text x="100" y="38" fill={color} fontFamily="Georgia, serif" fontSize="38" fontWeight="bold">P</text>
      </svg>
    )
  }
  
  if (variant === "geometrico") {
    return (
      <svg viewBox="0 0 160 50" className={`${s.height} w-auto`}>
        <g fill={color}>
          <rect x="15" y="8" width="7" height="36" rx="1" />
          <rect x="15" y="8" width="22" height="7" rx="1" />
          <rect x="30" y="8" width="7" height="18" rx="1" />
          <rect x="15" y="19" width="22" height="7" rx="1" />
          <rect x="52" y="21" width="16" height="5" rx="2" />
          <rect x="82" y="8" width="7" height="36" rx="1" />
          <rect x="82" y="8" width="22" height="7" rx="1" />
          <rect x="97" y="8" width="7" height="18" rx="1" />
          <rect x="82" y="19" width="22" height="7" rx="1" />
        </g>
      </svg>
    )
  }
  
  if (variant === "elegante") {
    return (
      <svg viewBox="0 0 180 55" className={`${s.height} w-auto`}>
        <line x1="8" y1="6" x2="172" y2="6" stroke={color} strokeWidth="1" />
        <text x="18" y="40" fill={color} fontFamily="Georgia, serif" fontSize="36" fontStyle="italic">P</text>
        <text x="52" y="40" fill={color} fontFamily="Georgia, serif" fontSize="26">&</text>
        <text x="80" y="40" fill={color} fontFamily="Georgia, serif" fontSize="36" fontStyle="italic">P</text>
        <text x="115" y="36" fill={color} fontFamily="Arial, sans-serif" fontSize="11" letterSpacing="2.5">ABOGADOS</text>
        <line x1="8" y1="50" x2="172" y2="50" stroke={color} strokeWidth="1" />
      </svg>
    )
  }
  
  return null
}

// Componente del Logo completo con texto
function PPLogo({ theme, variant, size = "md" }: { theme: typeof THEMES.ppAbogados; variant: LogoVariant; size?: "sm" | "md" | "lg" }) {
  const isDark = theme.style === "luxury"
  const goldColor = isDark ? "#D4AF37" : theme.primary
  
  const showAbogadosText = variant !== "elegante" && variant !== "original"
  
  return (
    <div className="flex items-center gap-2">
      <LogoSVG variant={variant} color={goldColor} size={size} />
      {showAbogadosText && (
        <span 
          className="font-serif tracking-widest text-[10px] md:text-xs"
          style={{ color: goldColor }}
        >
          ABOGADOS
        </span>
      )}
    </div>
  )
}

// Header Mockup mejorado
function HeaderMockup({ theme, logoVariant }: { theme: typeof THEMES.ppAbogados; logoVariant: LogoVariant }) {
  const isDark = theme.style === "luxury"
  
  return (
    <header 
      className="flex items-center justify-between px-3 md:px-4 py-3 border-b"
      style={{ 
        backgroundColor: isDark ? theme.cardBg : theme.background,
        borderColor: isDark ? '#333' : '#e5e7eb'
      }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
          <Menu className="h-4 w-4" style={{ color: theme.textPrimary }} />
        </Button>
        <PPLogo theme={theme} variant={logoVariant} size="sm" />
      </div>
      
      <div className="flex items-center gap-1 md:gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" style={{ color: theme.textSecondary }} />
        </Button>
        <div 
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          CM
        </div>
      </div>
    </header>
  )
}

// Dashboard Mockup
function DashboardMockup({ theme, logoVariant }: { theme: typeof THEMES.ppAbogados; logoVariant: LogoVariant }) {
  const isDark = theme.style === "luxury"
  
  return (
    <div className="min-h-[520px]" style={{ backgroundColor: theme.background }}>
      <HeaderMockup theme={theme} logoVariant={logoVariant} />
      
      <div className={`p-4 md:p-6 bg-gradient-to-br ${theme.gradient}`}>
        <div className="text-white">
          <p className="text-xs md:text-sm opacity-80">Bienvenido de vuelta</p>
          <h1 className="text-lg md:text-xl font-bold mt-1">Carlos Martinez</h1>
          <p className="text-xs md:text-sm opacity-80 mt-1">Tu caso esta en buenas manos</p>
        </div>
        
        <Card className="mt-4 border-0 shadow-lg" style={{ backgroundColor: theme.cardBg }}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>Liquidacion estimada</p>
                <p className="text-xl md:text-2xl font-bold" style={{ color: theme.primary }}>$47,850</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>Progreso</p>
                <p className="text-base md:text-lg font-semibold text-emerald-600">65%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Calculator, label: "Calcular" },
            { icon: FileText, label: "Boveda" },
            { icon: Scale, label: "Casos" },
            { icon: Building2, label: "Buro" },
          ].map((item, i) => (
            <button 
              key={i}
              className="flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl transition-colors"
              style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
            >
              <div 
                className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.primary}15` }}
              >
                <item.icon className="h-4 w-4 md:h-5 md:w-5" style={{ color: theme.primary }} />
              </div>
              <span className="text-[10px] md:text-xs" style={{ color: theme.textPrimary }}>{item.label}</span>
            </button>
          ))}
        </div>
        
        <Card style={{ backgroundColor: isDark ? '#252525' : '#fffbeb', borderColor: isDark ? '#333' : '#fbbf24' }}>
          <CardContent className="p-2.5 md:p-3 flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium truncate" style={{ color: theme.textPrimary }}>
                Audiencia en 5 dias
              </p>
              <p className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>
                3 Feb 2026 - 10:00 AM
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="pt-2 flex items-center justify-center gap-2 opacity-60">
          <span className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>Powered by</span>
          <span className="text-[10px] md:text-xs font-semibold" style={{ color: theme.primary }}>mecorrieron.mx</span>
        </div>
      </div>
    </div>
  )
}

// Calculadora Mockup
function CalculadoraMockup({ theme, logoVariant }: { theme: typeof THEMES.ppAbogados; logoVariant: LogoVariant }) {
  const isDark = theme.style === "luxury"
  
  return (
    <div className="min-h-[520px] p-0" style={{ backgroundColor: theme.background }}>
      <HeaderMockup theme={theme} logoVariant={logoVariant} />
      
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        <Card style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}>
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <p className="text-xs md:text-sm mb-1" style={{ color: theme.textSecondary }}>
                Tu liquidacion estimada
              </p>
              <p className="text-3xl md:text-4xl font-bold" style={{ color: theme.primary }}>
                $47,850.00
              </p>
              <p className="text-[10px] md:text-xs mt-2" style={{ color: theme.textSecondary }}>
                Calculado el 28 de enero, 2026
              </p>
            </div>
            
            <div className="mt-4 md:mt-6 grid grid-cols-2 gap-2 md:gap-3">
              {[
                { label: "Aguinaldo", value: "$12,500" },
                { label: "Vacaciones", value: "$8,350" },
                { label: "Prima Vac.", value: "$2,000" },
                { label: "Indemnizacion", value: "$25,000" },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="p-2 md:p-3 rounded-lg text-center"
                  style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
                >
                  <p className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>{item.label}</p>
                  <p className="font-semibold text-sm md:text-base" style={{ color: theme.textPrimary }}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <Button className="h-10 md:h-12 text-xs md:text-sm" style={{ backgroundColor: theme.primary, color: 'white' }}>
            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Descargar PDF
          </Button>
          <Button 
            variant="outline"
            className="h-10 md:h-12 text-xs md:text-sm bg-transparent"
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <Scale className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Iniciar Caso
          </Button>
        </div>
        
        <div 
          className="flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-lg"
          style={{ backgroundColor: isDark ? '#252525' : `${theme.primary}10` }}
        >
          <Shield className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: theme.primary }} />
          <span className="text-xs md:text-sm" style={{ color: theme.textPrimary }}>
            Asesorado por <strong>P&P Abogados</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

// Boveda Mockup
function BovedaMockup({ theme, logoVariant }: { theme: typeof THEMES.ppAbogados; logoVariant: LogoVariant }) {
  const isDark = theme.style === "luxury"
  
  const documentos = [
    { nombre: "Contrato de trabajo", tipo: "PDF", fecha: "15 Ene", icon: FileText },
    { nombre: "INE Frente", tipo: "IMG", fecha: "20 Ene", icon: User },
    { nombre: "Recibo de nomina", tipo: "PDF", fecha: "25 Ene", icon: DollarSign },
  ]
  
  return (
    <div className="min-h-[520px]" style={{ backgroundColor: theme.background }}>
      <HeaderMockup theme={theme} logoVariant={logoVariant} />
      
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Docs", value: "8", icon: FileText },
            { label: "Calculos", value: "3", icon: Calculator },
            { label: "Casos", value: "1", icon: Briefcase },
          ].map((stat, i) => (
            <Card key={i} style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}>
              <CardContent className="p-2 md:p-3 text-center">
                <stat.icon className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1" style={{ color: theme.primary }} />
                <p className="text-lg md:text-xl font-bold" style={{ color: theme.textPrimary }}>{stat.value}</p>
                <p className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}>
          <CardHeader className="pb-2 px-3 md:px-4 pt-3 md:pt-4">
            <CardTitle className="text-xs md:text-sm flex items-center justify-between" style={{ color: theme.textPrimary }}>
              Mis Documentos
              <Badge className="text-[10px]" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
                8
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 md:px-4 pb-3 md:pb-4">
            {documentos.map((doc, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-2 md:p-3 rounded-lg"
                style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div 
                    className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${theme.primary}20` }}
                  >
                    <doc.icon className="h-4 w-4 md:h-5 md:w-5" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <p className="font-medium text-xs md:text-sm" style={{ color: theme.textPrimary }}>{doc.nombre}</p>
                    <p className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>{doc.tipo} - {doc.fecha}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" style={{ color: theme.textSecondary }} />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Button 
          className="w-full h-10 md:h-12 text-xs md:text-sm"
          style={{ backgroundColor: theme.primary, color: 'white' }}
        >
          <Upload className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
          Subir documento
        </Button>
      </div>
    </div>
  )
}

// Casos Mockup
function CasosMockup({ theme, logoVariant }: { theme: typeof THEMES.ppAbogados; logoVariant: LogoVariant }) {
  const isDark = theme.style === "luxury"
  
  return (
    <div className="min-h-[520px]" style={{ backgroundColor: theme.background }}>
      <HeaderMockup theme={theme} logoVariant={logoVariant} />
      
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        <Card 
          className="overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}
        >
          <div className="h-1.5" style={{ backgroundColor: theme.primary }} />
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge 
                  className="mb-2 text-[10px]"
                  style={{ backgroundColor: '#10b98120', color: '#10b981' }}
                >
                  En proceso
                </Badge>
                <h3 className="font-semibold text-sm md:text-base" style={{ color: theme.textPrimary }}>
                  Caso #MC-2026-0042
                </h3>
                <p className="text-xs md:text-sm" style={{ color: theme.textSecondary }}>
                  vs. Empresa ABC S.A.
                </p>
              </div>
              <div 
                className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.primary}15` }}
              >
                <Scale className="h-5 w-5 md:h-6 md:w-6" style={{ color: theme.primary }} />
              </div>
            </div>
            
            <div className="space-y-1.5 mb-3 md:mb-4">
              <div className="flex justify-between text-[10px] md:text-xs">
                <span style={{ color: theme.textSecondary }}>Progreso</span>
                <span style={{ color: theme.primary }}>65%</span>
              </div>
              <Progress value={65} className="h-1.5 md:h-2" />
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              {[
                { text: "Documentos recopilados", done: true },
                { text: "Solicitud CCL generada", done: true },
                { text: "Audiencia programada", done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: theme.textSecondary }} />
                  )}
                  <span 
                    className="text-xs md:text-sm"
                    style={{ color: step.done ? theme.textPrimary : theme.textSecondary }}
                  >
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
            
            <div 
              className="mt-3 md:mt-4 p-2 md:p-3 rounded-lg flex items-center gap-2 md:gap-3"
              style={{ backgroundColor: isDark ? '#252525' : `${theme.primary}08` }}
            >
              <div 
                className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm"
                style={{ backgroundColor: theme.primary }}
              >
                JP
              </div>
              <div className="flex-1">
                <p className="font-medium text-xs md:text-sm" style={{ color: theme.textPrimary }}>
                  Lic. Juan Perez
                </p>
                <p className="text-[10px] md:text-xs" style={{ color: theme.textSecondary }}>
                  P&P Abogados
                </p>
              </div>
              <Badge className="text-[10px]" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
                <Star className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5" fill={theme.primary} />
                4.9
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <Button 
            variant="outline"
            className="h-14 md:h-16 flex-col gap-1 bg-transparent text-xs"
            style={{ borderColor: isDark ? '#333' : '#e5e7eb', color: theme.textPrimary }}
          >
            <Sparkles className="h-4 w-4 md:h-5 md:w-5" style={{ color: theme.primary }} />
            <span>Generar Solicitud</span>
          </Button>
          <Button 
            variant="outline"
            className="h-14 md:h-16 flex-col gap-1 bg-transparent text-xs"
            style={{ borderColor: isDark ? '#333' : '#e5e7eb', color: theme.textPrimary }}
          >
            <Calendar className="h-4 w-4 md:h-5 md:w-5" style={{ color: theme.primary }} />
            <span>Ver Audiencias</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Seccion de beneficios para venta
function BenefitsSection() {
  const benefits = [
    { 
      icon: Zap, 
      title: "Tecnologia de vanguardia", 
      desc: "IA para generacion de documentos legales automatizados" 
    },
    { 
      icon: Users, 
      title: "Captacion de clientes", 
      desc: "Acceso a trabajadores buscando asesoria legal" 
    },
    { 
      icon: Award, 
      title: "Tu marca, tu identidad", 
      desc: "App completamente personalizada con tu imagen" 
    },
    { 
      icon: Lock, 
      title: "Seguridad garantizada", 
      desc: "Encriptacion y almacenamiento seguro de datos" 
    },
  ]
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {benefits.map((b, i) => (
        <Card key={i} className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <b.icon className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-sm md:text-base mb-1">{b.title}</h3>
            <p className="text-xs md:text-sm text-gray-600">{b.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Componente Principal
export default function WhiteLabelPreview() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("ppAbogados")
  const [selectedLogo, setSelectedLogo] = useState<LogoVariant>("balanza")
  const [selectedScreen, setSelectedScreen] = useState("dashboard")
  
  const theme = THEMES[selectedTheme]
  const isDark = theme.style === "luxury"
  
  const goldColor = isDark ? "#D4AF37" : theme.primary
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero de venta */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
            Alianza Estrategica
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tu despacho. Tu marca.<br />
            <span className="text-amber-400">Nuestra tecnologia.</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-sm md:text-base">
            Ofrece a tus clientes una experiencia digital de primera con la app de MeCorrieron 
            completamente personalizada con la identidad de tu despacho.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Phone className="h-4 w-4 mr-2" />
              Agendar Demo
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
              <Mail className="h-4 w-4 mr-2" />
              Contactar Ventas
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Beneficios */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">Por que afiliarte a MeCorrieron</h2>
          <BenefitsSection />
        </div>
        
        {/* Ejemplo interactivo */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Vista previa: P&P Abogados</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Personaliza y visualiza como se veria tu app</p>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="/images/pp-abogados-logo.png" 
                  alt="P&P Abogados"
                  className="h-10 md:h-12 object-contain"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Selector de Logo */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm md:text-base">1. Selecciona estilo de logo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                {(Object.keys(LOGO_VARIANTS) as LogoVariant[]).map((key) => {
                  const v = LOGO_VARIANTS[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedLogo(key)}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        selectedLogo === key ? 'ring-2 ring-amber-400 ring-offset-2 border-amber-400' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="h-10 md:h-12 flex items-center justify-center">
                        <LogoSVG variant={key} color={goldColor} size="sm" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] md:text-xs font-medium">{v.name}</p>
                      </div>
                      {selectedLogo === key && (
                        <Check className="h-4 w-4 text-amber-500 absolute top-2 right-2" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Selector de Tema */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm md:text-base">2. Selecciona paleta de colores</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
                  const t = THEMES[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedTheme(key)}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                        selectedTheme === key ? 'ring-2 ring-amber-400 ring-offset-2 border-amber-400' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: t.background }}
                    >
                      <div className="flex gap-1.5 mb-2 justify-center">
                        <div className="h-5 w-5 md:h-6 md:w-6 rounded-full shadow-sm" style={{ backgroundColor: t.primary }} />
                        <div className="h-5 w-5 md:h-6 md:w-6 rounded-full shadow-sm" style={{ backgroundColor: t.secondary }} />
                        <div className="h-5 w-5 md:h-6 md:w-6 rounded-full shadow-sm" style={{ backgroundColor: t.accent }} />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-center" style={{ color: t.textPrimary }}>
                        {t.name}
                      </p>
                      <p className="text-[10px] md:text-xs text-center" style={{ color: t.textSecondary }}>
                        {t.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Selector de Pantalla */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm md:text-base">3. Explora las pantallas</h3>
              <Tabs value={selectedScreen} onValueChange={setSelectedScreen}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="dashboard" className="text-xs md:text-sm">Dashboard</TabsTrigger>
                  <TabsTrigger value="calculadora" className="text-xs md:text-sm">Calculadora</TabsTrigger>
                  <TabsTrigger value="boveda" className="text-xs md:text-sm">Boveda</TabsTrigger>
                  <TabsTrigger value="casos" className="text-xs md:text-sm">Casos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Mockups */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Vista Mobile */}
              <div>
                <p className="text-xs md:text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Vista Mobile
                </p>
                <div className="flex justify-center">
                  <div 
                    className="w-[280px] sm:w-[320px] rounded-[2rem] overflow-hidden border-[6px] shadow-2xl"
                    style={{ borderColor: isDark ? '#333' : '#1f2937' }}
                  >
                    {/* Notch */}
                    <div className="h-6 flex justify-center items-end pb-1" style={{ backgroundColor: isDark ? theme.cardBg : theme.background }}>
                      <div className="w-20 h-4 bg-black rounded-full" />
                    </div>
                    {selectedScreen === "dashboard" && <DashboardMockup theme={theme} logoVariant={selectedLogo} />}
                    {selectedScreen === "calculadora" && <CalculadoraMockup theme={theme} logoVariant={selectedLogo} />}
                    {selectedScreen === "boveda" && <BovedaMockup theme={theme} logoVariant={selectedLogo} />}
                    {selectedScreen === "casos" && <CasosMockup theme={theme} logoVariant={selectedLogo} />}
                  </div>
                </div>
              </div>
              
              {/* Especificaciones */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Logo seleccionado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <LogoSVG variant={selectedLogo} color={goldColor} size="lg" />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {LOGO_VARIANTS[selectedLogo].description}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Paleta de colores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="h-14 rounded-lg mb-1 shadow-sm" style={{ backgroundColor: theme.primary }} />
                        <p className="text-[10px] text-gray-500">Primary</p>
                        <p className="text-[10px] font-mono">{theme.primary}</p>
                      </div>
                      <div className="text-center">
                        <div className="h-14 rounded-lg mb-1 shadow-sm" style={{ backgroundColor: theme.secondary }} />
                        <p className="text-[10px] text-gray-500">Secondary</p>
                        <p className="text-[10px] font-mono">{theme.secondary}</p>
                      </div>
                      <div className="text-center">
                        <div className="h-14 rounded-lg mb-1 shadow-sm" style={{ backgroundColor: theme.accent }} />
                        <p className="text-[10px] text-gray-500">Accent</p>
                        <p className="text-[10px] font-mono">{theme.accent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Incluido en la alianza</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      "App personalizada con tu marca",
                      "Generador de documentos con IA",
                      "Panel de administracion de casos",
                      "Boveda digital para clientes",
                      "Acceso a marketplace de casos",
                      "Soporte tecnico prioritario"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs md:text-sm">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* CTA Final */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
          <CardContent className="p-6 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3">
              Listo para digitalizar tu despacho?
            </h2>
            <p className="text-amber-100 mb-6 max-w-xl mx-auto text-sm md:text-base">
              Unete a los despachos que ya estan transformando la forma de atender casos laborales en Mexico.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50 font-semibold">
                <Phone className="h-4 w-4 mr-2" />
                Agendar llamada
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 bg-transparent">
                <Globe className="h-4 w-4 mr-2" />
                Mas informacion
              </Button>
            </div>
            <p className="text-amber-200 text-xs md:text-sm mt-6">
              Sin costo de implementacion por tiempo limitado
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-2xl font-bold text-amber-400 mb-2">mecorrieron.mx</p>
          <p className="text-gray-400 text-sm">
            Tecnologia legal al servicio de los trabajadores mexicanos
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
            <span>contacto@mecorrieron.mx</span>
            <span>+52 55 1234 5678</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
