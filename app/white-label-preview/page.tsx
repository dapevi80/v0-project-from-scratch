"use client"

import { useState } from "react"
import { 
  Calculator, FileText, Briefcase, Scale, Shield, 
  Upload, ChevronRight, Bell, Menu, User, Home,
  Clock, CheckCircle2, AlertCircle, TrendingUp,
  Building2, Calendar, DollarSign, Star, Sparkles
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Temas disponibles para white-label
const THEMES = {
  ppAbogados: {
    name: "P&P Abogados - Clasico Dorado",
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
    name: "P&P Abogados - Moderno Navy",
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
    name: "P&P Abogados - Minimalista",
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
    name: "P&P Abogados - Lujo Premium",
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

// Componente del Logo P&P mejorado
function PPLogo({ theme, size = "md" }: { theme: typeof THEMES.ppAbogados; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { container: "h-8", text: "text-lg", sub: "text-[8px]" },
    md: { container: "h-12", text: "text-2xl", sub: "text-[10px]" },
    lg: { container: "h-20", text: "text-4xl", sub: "text-sm" }
  }
  
  const isDark = theme.style === "luxury"
  const goldColor = isDark ? "#D4AF37" : theme.primary
  
  return (
    <div className={`flex items-center gap-2 ${sizes[size].container}`}>
      <div className="relative">
        {/* Logo mejorado con balanza integrada */}
        <svg viewBox="0 0 120 50" className={sizes[size].container} style={{ width: 'auto' }}>
          {/* P izquierda */}
          <text x="5" y="35" 
            fill={goldColor}
            fontFamily="Georgia, serif" 
            fontSize="38" 
            fontWeight="bold">P</text>
          
          {/* Ampersand estilizado como balanza */}
          <g transform="translate(35, 8)">
            {/* Poste central */}
            <rect x="12" y="8" width="2" height="28" fill={goldColor} />
            {/* Brazo superior */}
            <rect x="2" y="8" width="22" height="2" fill={goldColor} />
            {/* Platillo izquierdo */}
            <path d="M2 10 L2 14 Q6 18 10 14 L10 10" fill="none" stroke={goldColor} strokeWidth="1.5" />
            {/* Platillo derecho */}
            <path d="M16 10 L16 14 Q20 18 24 14 L24 10" fill="none" stroke={goldColor} strokeWidth="1.5" />
            {/* Base */}
            <path d="M8 36 L18 36 L13 32 Z" fill={goldColor} />
          </g>
          
          {/* P derecha */}
          <text x="72" y="35" 
            fill={goldColor}
            fontFamily="Georgia, serif" 
            fontSize="38" 
            fontWeight="bold">P</text>
        </svg>
      </div>
      
      <div className="flex flex-col">
        <span 
          className={`font-serif font-bold tracking-wide ${sizes[size].sub}`}
          style={{ color: goldColor, letterSpacing: '0.2em' }}
        >
          ABOGADOS
        </span>
      </div>
    </div>
  )
}

// Mockup del Header
function HeaderMockup({ theme }: { theme: typeof THEMES.ppAbogados }) {
  const isDark = theme.style === "luxury"
  
  return (
    <header 
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ 
        backgroundColor: isDark ? theme.cardBg : theme.background,
        borderColor: isDark ? '#333' : '#e5e7eb'
      }}
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" style={{ color: theme.textPrimary }} />
        </Button>
        <PPLogo theme={theme} size="sm" />
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" style={{ color: theme.textSecondary }} />
        </Button>
        <div 
          className="h-8 w-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.primary }}
        >
          <User className="h-4 w-4 text-white" />
        </div>
      </div>
    </header>
  )
}

// Mockup de la Calculadora
function CalculadoraMockup({ theme }: { theme: typeof THEMES.ppAbogados }) {
  const isDark = theme.style === "luxury"
  
  return (
    <div 
      className="min-h-[500px] p-4"
      style={{ backgroundColor: theme.background }}
    >
      <HeaderMockup theme={theme} />
      
      <div className="mt-4 space-y-4">
        {/* Card de resultado */}
        <Card style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: theme.textSecondary }}>
                Tu liquidacion estimada
              </p>
              <p 
                className="text-4xl font-bold"
                style={{ color: theme.primary }}
              >
                $47,850.00
              </p>
              <p className="text-xs mt-2" style={{ color: theme.textSecondary }}>
                Calculado el 28 de enero, 2026
              </p>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div 
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
              >
                <p className="text-xs" style={{ color: theme.textSecondary }}>Aguinaldo</p>
                <p className="font-semibold" style={{ color: theme.textPrimary }}>$12,500</p>
              </div>
              <div 
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
              >
                <p className="text-xs" style={{ color: theme.textSecondary }}>Vacaciones</p>
                <p className="font-semibold" style={{ color: theme.textPrimary }}>$8,350</p>
              </div>
              <div 
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
              >
                <p className="text-xs" style={{ color: theme.textSecondary }}>Prima Vac.</p>
                <p className="font-semibold" style={{ color: theme.textPrimary }}>$2,000</p>
              </div>
              <div 
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
              >
                <p className="text-xs" style={{ color: theme.textSecondary }}>Indemnizacion</p>
                <p className="font-semibold" style={{ color: theme.textPrimary }}>$25,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-12"
            style={{ backgroundColor: theme.primary, color: 'white' }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button 
            variant="outline"
            className="h-12 bg-transparent"
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <Scale className="h-4 w-4 mr-2" />
            Iniciar Caso
          </Button>
        </div>
        
        {/* Badge del despacho */}
        <div 
          className="flex items-center justify-center gap-2 py-3 rounded-lg"
          style={{ backgroundColor: isDark ? '#252525' : `${theme.primary}10` }}
        >
          <Shield className="h-4 w-4" style={{ color: theme.primary }} />
          <span className="text-sm" style={{ color: theme.textPrimary }}>
            Asesorado por <strong>P&P Abogados</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

// Mockup de Documentos/Boveda
function BovedaMockup({ theme }: { theme: typeof THEMES.ppAbogados }) {
  const isDark = theme.style === "luxury"
  
  const documentos = [
    { nombre: "Contrato de trabajo", tipo: "PDF", fecha: "15 Ene 2026", icon: FileText },
    { nombre: "INE Frente", tipo: "Imagen", fecha: "20 Ene 2026", icon: User },
    { nombre: "Ultimo recibo de nomina", tipo: "PDF", fecha: "25 Ene 2026", icon: DollarSign },
  ]
  
  return (
    <div 
      className="min-h-[500px] p-4"
      style={{ backgroundColor: theme.background }}
    >
      <HeaderMockup theme={theme} />
      
      <div className="mt-4 space-y-4">
        {/* Estadisticas */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Documentos", value: "8", icon: FileText },
            { label: "Calculos", value: "3", icon: Calculator },
            { label: "Casos", value: "1", icon: Briefcase },
          ].map((stat, i) => (
            <Card key={i} style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}>
              <CardContent className="p-3 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-1" style={{ color: theme.primary }} />
                <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>{stat.value}</p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Lista de documentos */}
        <Card style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between" style={{ color: theme.textPrimary }}>
              Mis Documentos
              <Badge style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
                8 archivos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documentos.map((doc, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${theme.primary}20` }}
                  >
                    <doc.icon className="h-5 w-5" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: theme.textPrimary }}>{doc.nombre}</p>
                    <p className="text-xs" style={{ color: theme.textSecondary }}>{doc.tipo} - {doc.fecha}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" style={{ color: theme.textSecondary }} />
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Boton subir */}
        <Button 
          className="w-full h-12"
          style={{ backgroundColor: theme.primary, color: 'white' }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir documento
        </Button>
      </div>
    </div>
  )
}

// Mockup de Mis Casos
function CasosMockup({ theme }: { theme: typeof THEMES.ppAbogados }) {
  const isDark = theme.style === "luxury"
  
  return (
    <div 
      className="min-h-[500px] p-4"
      style={{ backgroundColor: theme.background }}
    >
      <HeaderMockup theme={theme} />
      
      <div className="mt-4 space-y-4">
        {/* Caso activo */}
        <Card 
          className="overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: isDark ? '#333' : '#e5e7eb' }}
        >
          <div 
            className="h-2"
            style={{ backgroundColor: theme.primary }}
          />
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge 
                  className="mb-2"
                  style={{ backgroundColor: '#10b98120', color: '#10b981' }}
                >
                  En proceso
                </Badge>
                <h3 className="font-semibold" style={{ color: theme.textPrimary }}>
                  Caso #MC-2026-0042
                </h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  vs. Empresa ABC S.A. de C.V.
                </p>
              </div>
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.primary}15` }}
              >
                <Scale className="h-6 w-6" style={{ color: theme.primary }} />
              </div>
            </div>
            
            {/* Progreso */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.textSecondary }}>Progreso del caso</span>
                <span style={{ color: theme.primary }}>65%</span>
              </div>
              <Progress value={65} className="h-2" style={{ backgroundColor: isDark ? '#333' : '#e5e7eb' }} />
            </div>
            
            {/* Timeline mini */}
            <div className="space-y-2">
              {[
                { text: "Documentos recopilados", done: true },
                { text: "Solicitud CCL generada", done: true },
                { text: "Audiencia programada", done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4" style={{ color: theme.textSecondary }} />
                  )}
                  <span 
                    className="text-sm"
                    style={{ color: step.done ? theme.textPrimary : theme.textSecondary }}
                  >
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Abogado asignado */}
            <div 
              className="mt-4 p-3 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: isDark ? '#252525' : `${theme.primary}08` }}
            >
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: theme.primary }}
              >
                JP
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm" style={{ color: theme.textPrimary }}>
                  Lic. Juan Perez
                </p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  P&P Abogados
                </p>
              </div>
              <Badge style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
                <Star className="h-3 w-3 mr-1" />
                4.9
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Acciones rapidas */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            className="h-16 flex-col gap-1 bg-transparent"
            style={{ borderColor: isDark ? '#333' : '#e5e7eb', color: theme.textPrimary }}
          >
            <Sparkles className="h-5 w-5" style={{ color: theme.primary }} />
            <span className="text-xs">Generar Solicitud CCL</span>
          </Button>
          <Button 
            variant="outline"
            className="h-16 flex-col gap-1 bg-transparent"
            style={{ borderColor: isDark ? '#333' : '#e5e7eb', color: theme.textPrimary }}
          >
            <Calendar className="h-5 w-5" style={{ color: theme.primary }} />
            <span className="text-xs">Ver Audiencias</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Mockup de Dashboard
function DashboardMockup({ theme }: { theme: typeof THEMES.ppAbogados }) {
  const isDark = theme.style === "luxury"
  
  return (
    <div 
      className="min-h-[500px]"
      style={{ backgroundColor: theme.background }}
    >
      <HeaderMockup theme={theme} />
      
      {/* Hero Section */}
      <div 
        className={`p-6 bg-gradient-to-br ${theme.gradient}`}
      >
        <div className="text-white">
          <p className="text-sm opacity-80">Bienvenido de vuelta</p>
          <h1 className="text-xl font-bold mt-1">Carlos Martinez</h1>
          <p className="text-sm opacity-80 mt-2">Tu caso esta en buenas manos</p>
        </div>
        
        <Card className="mt-4 border-0 shadow-lg" style={{ backgroundColor: theme.cardBg }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: theme.textSecondary }}>Liquidacion estimada</p>
                <p className="text-2xl font-bold" style={{ color: theme.primary }}>$47,850</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: theme.textSecondary }}>Progreso</p>
                <p className="text-lg font-semibold text-green-600">65%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Acciones rapidas */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Calculator, label: "Calcular" },
            { icon: FileText, label: "Boveda" },
            { icon: Scale, label: "Casos" },
            { icon: Building2, label: "Buro" },
          ].map((item, i) => (
            <button 
              key={i}
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors"
              style={{ backgroundColor: isDark ? '#252525' : '#f8f9fa' }}
            >
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.primary}15` }}
              >
                <item.icon className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <span className="text-xs" style={{ color: theme.textPrimary }}>{item.label}</span>
            </button>
          ))}
        </div>
        
        {/* Notificacion */}
        <Card style={{ backgroundColor: isDark ? '#252525' : '#fffbeb', borderColor: isDark ? '#333' : '#fbbf24' }}>
          <CardContent className="p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                Audiencia en 5 dias
              </p>
              <p className="text-xs" style={{ color: theme.textSecondary }}>
                3 de febrero, 2026 - 10:00 AM
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer con marca */}
        <div className="pt-4 flex items-center justify-center gap-2 opacity-60">
          <span className="text-xs" style={{ color: theme.textSecondary }}>Powered by</span>
          <span className="text-xs font-semibold" style={{ color: theme.primary }}>mecorrieron.mx</span>
        </div>
      </div>
    </div>
  )
}

// Propuesta de logo mejorado
function LogoProposal({ theme }: { theme: typeof THEMES.ppAbogados }) {
  const isDark = theme.style === "luxury"
  const gold = "#C9A227"
  
  return (
    <div className="space-y-6">
      <h3 className="font-semibold" style={{ color: theme.textPrimary }}>
        Propuestas de Logo Mejorado
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Opcion A: Minimalista con balanza integrada */}
        <div 
          className="p-6 rounded-xl flex flex-col items-center gap-3"
          style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }}
        >
          <svg viewBox="0 0 160 60" className="h-16 w-auto">
            {/* P estilizada izquierda */}
            <text x="10" y="42" fill={gold} fontFamily="Georgia, serif" fontSize="42" fontWeight="bold">P</text>
            
            {/* Balanza central minimalista */}
            <g transform="translate(55, 12)">
              <line x1="15" y1="0" x2="15" y2="35" stroke={gold} strokeWidth="2" />
              <line x1="0" y1="5" x2="30" y2="5" stroke={gold} strokeWidth="2" />
              <circle cx="0" cy="12" r="6" fill="none" stroke={gold} strokeWidth="1.5" />
              <circle cx="30" cy="12" r="6" fill="none" stroke={gold} strokeWidth="1.5" />
              <polygon points="10,38 20,38 15,33" fill={gold} />
            </g>
            
            {/* P estilizada derecha */}
            <text x="100" y="42" fill={gold} fontFamily="Georgia, serif" fontSize="42" fontWeight="bold">P</text>
          </svg>
          <p className="text-xs text-center" style={{ color: theme.textSecondary }}>
            A. Balanza Central
          </p>
        </div>
        
        {/* Opcion B: Ampersand como escudo */}
        <div 
          className="p-6 rounded-xl flex flex-col items-center gap-3"
          style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }}
        >
          <svg viewBox="0 0 160 60" className="h-16 w-auto">
            <text x="15" y="42" fill={gold} fontFamily="Georgia, serif" fontSize="42" fontWeight="bold">P</text>
            
            {/* Escudo con & */}
            <g transform="translate(55, 5)">
              <path 
                d="M15 0 L30 8 L30 30 L15 40 L0 30 L0 8 Z" 
                fill="none" 
                stroke={gold} 
                strokeWidth="2"
              />
              <text x="8" y="28" fill={gold} fontFamily="Georgia, serif" fontSize="22">&</text>
            </g>
            
            <text x="100" y="42" fill={gold} fontFamily="Georgia, serif" fontSize="42" fontWeight="bold">P</text>
          </svg>
          <p className="text-xs text-center" style={{ color: theme.textSecondary }}>
            B. Escudo Protector
          </p>
        </div>
        
        {/* Opcion C: Moderno geometrico */}
        <div 
          className="p-6 rounded-xl flex flex-col items-center gap-3"
          style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }}
        >
          <svg viewBox="0 0 160 60" className="h-16 w-auto">
            {/* Dos P's conectadas geometricamente */}
            <rect x="20" y="10" width="8" height="40" fill={gold} />
            <rect x="20" y="10" width="25" height="8" fill={gold} />
            <rect x="37" y="10" width="8" height="20" fill={gold} />
            <rect x="20" y="22" width="25" height="8" fill={gold} />
            
            {/* Conector dorado */}
            <rect x="55" y="24" width="15" height="4" fill={gold} />
            
            <rect x="80" y="10" width="8" height="40" fill={gold} />
            <rect x="80" y="10" width="25" height="8" fill={gold} />
            <rect x="97" y="10" width="8" height="20" fill={gold} />
            <rect x="80" y="22" width="25" height="8" fill={gold} />
          </svg>
          <p className="text-xs text-center" style={{ color: theme.textSecondary }}>
            C. Geometrico Moderno
          </p>
        </div>
        
        {/* Opcion D: Elegante con lineas */}
        <div 
          className="p-6 rounded-xl flex flex-col items-center gap-3"
          style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }}
        >
          <svg viewBox="0 0 180 60" className="h-16 w-auto">
            {/* Linea decorativa superior */}
            <line x1="10" y1="8" x2="170" y2="8" stroke={gold} strokeWidth="1" />
            
            <text x="20" y="42" fill={gold} fontFamily="Playfair Display, Georgia, serif" fontSize="36" fontWeight="normal" fontStyle="italic">P</text>
            <text x="55" y="42" fill={gold} fontFamily="Playfair Display, Georgia, serif" fontSize="28" fontWeight="normal">&</text>
            <text x="85" y="42" fill={gold} fontFamily="Playfair Display, Georgia, serif" fontSize="36" fontWeight="normal" fontStyle="italic">P</text>
            
            {/* Texto ABOGADOS */}
            <text x="115" y="38" fill={gold} fontFamily="Arial, sans-serif" fontSize="10" letterSpacing="3">ABOGADOS</text>
            
            {/* Linea decorativa inferior */}
            <line x1="10" y1="52" x2="170" y2="52" stroke={gold} strokeWidth="1" />
          </svg>
          <p className="text-xs text-center" style={{ color: theme.textSecondary }}>
            D. Elegante Clasico
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente Principal
export default function WhiteLabelPreview() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("ppAbogados")
  const [selectedScreen, setSelectedScreen] = useState("dashboard")
  
  const theme = THEMES[selectedTheme]
  const isDark = theme.style === "luxury"
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            White-Label Preview: P&P Abogados
          </h1>
          <p className="text-gray-600">
            Personalizacion de la app MeCorrieron para despachos juridicos
          </p>
        </div>
        
        {/* Logo Original */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Logo Original del Despacho</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <img 
              src="/images/pp-abogados-logo.png" 
              alt="P&P Abogados Logo Original"
              className="h-24 object-contain"
            />
          </CardContent>
        </Card>
        
        {/* Selector de tema */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Selecciona un Tema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
                const t = THEMES[key]
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedTheme === key ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{ 
                      borderColor: selectedTheme === key ? t.primary : '#e5e7eb',
                      backgroundColor: t.background
                    }}
                  >
                    <div className="flex gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full" style={{ backgroundColor: t.primary }} />
                      <div className="h-6 w-6 rounded-full" style={{ backgroundColor: t.secondary }} />
                      <div className="h-6 w-6 rounded-full" style={{ backgroundColor: t.accent }} />
                    </div>
                    <p className="text-xs font-medium text-left" style={{ color: t.textPrimary }}>
                      {t.name}
                    </p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Propuestas de logo */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <LogoProposal theme={theme} />
          </CardContent>
        </Card>
        
        {/* Selector de pantalla */}
        <Tabs value={selectedScreen} onValueChange={setSelectedScreen} className="mb-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calculadora">Calculadora</TabsTrigger>
            <TabsTrigger value="boveda">Boveda</TabsTrigger>
            <TabsTrigger value="casos">Mis Casos</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Mockups */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Vista Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Vista Mobile
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div 
                className="w-[320px] rounded-[2rem] overflow-hidden border-8 shadow-xl"
                style={{ borderColor: isDark ? '#333' : '#1f2937' }}
              >
                {selectedScreen === "dashboard" && <DashboardMockup theme={theme} />}
                {selectedScreen === "calculadora" && <CalculadoraMockup theme={theme} />}
                {selectedScreen === "boveda" && <BovedaMockup theme={theme} />}
                {selectedScreen === "casos" && <CasosMockup theme={theme} />}
              </div>
            </CardContent>
          </Card>
          
          {/* Detalles del tema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Especificaciones del Tema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Paleta de Colores</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="h-12 rounded-lg mb-1" style={{ backgroundColor: theme.primary }} />
                    <p className="text-xs text-gray-600">Primary</p>
                    <p className="text-xs font-mono">{theme.primary}</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 rounded-lg mb-1" style={{ backgroundColor: theme.secondary }} />
                    <p className="text-xs text-gray-600">Secondary</p>
                    <p className="text-xs font-mono">{theme.secondary}</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 rounded-lg mb-1" style={{ backgroundColor: theme.accent }} />
                    <p className="text-xs text-gray-600">Accent</p>
                    <p className="text-xs font-mono">{theme.accent}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Caracteristicas</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>- Logo del despacho en header</li>
                  <li>- Colores personalizados en toda la app</li>
                  <li>- Badge "Asesorado por [Despacho]"</li>
                  <li>- Informacion del abogado asignado</li>
                  <li>- "Powered by mecorrieron.mx" en footer</li>
                </ul>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Estilo: {theme.style}</p>
                <p className="text-sm text-gray-600">
                  {theme.style === "elegant" && "Clasico y sofisticado, ideal para despachos tradicionales."}
                  {theme.style === "modern" && "Profesional y contemporaneo, transmite confianza."}
                  {theme.style === "minimal" && "Limpio y enfocado, resalta la funcionalidad."}
                  {theme.style === "luxury" && "Premium y exclusivo, para clientes de alto perfil."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
