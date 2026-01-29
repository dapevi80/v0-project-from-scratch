'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'
import { MoneyStepper } from '@/components/calc/money-stepper'
import { MoneySlider } from '@/components/calc/money-slider'
import { NumberStepper } from '@/components/calc/number-stepper'
import { OptionChips } from '@/components/calc/option-chips'
import { DateInput } from '@/components/calc/date-input'
import { TimePicker } from '@/components/calc/time-picker'
import { Checkbox } from '@/components/ui/checkbox'
import {
  calcularLiquidacion,
  calcularJuicioPotencial,
  formatMXN,
  SALARIO_MINIMO_GENERAL_2025,
  type DatosLiquidacion,
  type DatosJuicioPotencial,
  type ResultadoLiquidacion,
  type ResultadoJuicioPotencial,
  getDiasVacaciones,
  calcularAntiguedad,
} from '@/lib/constants/lft'
import { Calculator, Scale, FileText, Download, Save, History, Loader2, CheckCircle, Eye, X, Vault, AlertTriangle, MessageCircle, Shield, ChevronRight, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { downloadLiquidacionPDF, getLiquidacionPDFBlob } from '@/lib/pdf/generate-liquidacion-pdf'
import { downloadPropuestaEmpresaPDF, getPropuestaEmpresaPDFBlob, type DatosPropuestaEmpresa } from '@/lib/pdf/generate-propuesta-empresa-pdf'
import { guardarCalculoEnBoveda, verificarLimiteCalculos, crearCasoDesdeCalculo } from './actions'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Tipos para guardado
interface CalcRun {
  id: string
  createdAt: string
  inputs: DatosLiquidacion & DatosJuicioPotencial
  results: {
    liquidacion: ResultadoLiquidacion
    juicio?: ResultadoJuicioPotencial
  }
  mode: 'liquidacion' | 'juicio'
}

// Funciones para guardar datos de usuario guest en localStorage
function guardarDatosLaboralesGuest(datos: { nombreEmpresa: string; puestoTrabajo: string; fechaIngreso: string }) {
  const existentes = JSON.parse(localStorage.getItem('guest_calculos') || '[]')
  // Evitar duplicados por empresa
  const yaExiste = existentes.some((c: { nombreEmpresa: string }) => c.nombreEmpresa.toLowerCase() === datos.nombreEmpresa.toLowerCase())
  if (!yaExiste && existentes.length < 3) {
    existentes.push(datos)
    localStorage.setItem('guest_calculos', JSON.stringify(existentes.slice(0, 3)))
  }
}

function guardarCalculoGuest(datos: {
  nombreEmpresa: string
  puestoTrabajo: string
  fechaIngreso: string
  fechaSalida: string
  salarioDiario: number
  totalConciliacion: number
  totalJuicio: number
}) {
  const existentes = JSON.parse(localStorage.getItem('guest_calculos') || '[]')
  // Evitar duplicados por empresa, actualizar si ya existe
  const indice = existentes.findIndex((c: { nombreEmpresa: string }) => c.nombreEmpresa.toLowerCase() === datos.nombreEmpresa.toLowerCase())
  if (indice >= 0) {
    existentes[indice] = { ...existentes[indice], ...datos }
  } else if (existentes.length < 3) {
    existentes.push(datos)
  }
  localStorage.setItem('guest_calculos', JSON.stringify(existentes.slice(0, 3)))
}

export default function CalculadoraPage() {
  // Estado de datos de liquidación
  const [tipoSalario, setTipoSalario] = useState<'diario' | 'mensual'>('mensual')
  const [salarioMensual, setSalarioMensual] = useState(15000)
  const [salarioDiario, setSalarioDiario] = useState(500)
  const [rangoExtendido, setRangoExtendido] = useState(false)
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [fechaSalida, setFechaSalida] = useState('')
  const [sigoLaborando, setSigoLaborando] = useState(false)
  
  // Vacaciones - usuario captura días TOMADOS, sistema calcula pendientes
  const [diasVacacionesTomados, setDiasVacacionesTomados] = useState(0)
  const [primaVacacionalPct, setPrimaVacacionalPct] = useState(25)
  
  // Aguinaldo - días que la empresa paga (mínimo 15 por ley)
  const [diasAguinaldoEmpresa, setDiasAguinaldoEmpresa] = useState(15)
  // Aguinaldo adeudado del año pasado
  const [diasAguinaldoAdeudadoAnterior, setDiasAguinaldoAdeudadoAnterior] = useState(0)
  const [debenTodoAguinaldoAnterior, setDebenTodoAguinaldoAnterior] = useState(false)
  
  const [salariosAdeudadosDias, setSalariosAdeudadosDias] = useState(0)
  
  // Estado de juicio potencial
  const [duracionJuicio, setDuracionJuicio] = useState(6)
  const [salariosCaidos, setSalariosCaidos] = useState(true)
  const [horasExtraSemanales, setHorasExtraSemanales] = useState(0)
  const [semanasHorasExtra, setSemanasHorasExtra] = useState(0)
  
  const [comisionesPendientes, setComisionesPendientes] = useState(0)
  const [rangoComisionesExtendido, setRangoComisionesExtendido] = useState(false)
  
  const [domingosTrabajados, setDomingosTrabajados] = useState(0)
  const [diasFestivosTrabajados, setDiasFestivosTrabajados] = useState(0)
  const [diferenciasSalariales, setDiferenciasSalariales] = useState(0)
  const [rangoDiferenciasExtendido, setRangoDiferenciasExtendido] = useState(false)
  
  const [otroConcepto1, setOtroConcepto1] = useState({ nombre: '', monto: 0 })
  const [otroConcepto2, setOtroConcepto2] = useState({ nombre: '', monto: 0 })
  
  // Estado de resultados
  const [resultadoLiquidacion, setResultadoLiquidacion] = useState<ResultadoLiquidacion | null>(null)
  const [resultadoJuicio, setResultadoJuicio] = useState<ResultadoJuicioPotencial | null>(null)
  
  // Historial
  const [historial, setHistorial] = useState<CalcRun[]>([])
  const [showHistorial, setShowHistorial] = useState(false)
  

  
  // Estados para PDF y guardado
  const [descargandoPDF, setDescargandoPDF] = useState(false)
  const [guardandoBoveda, setGuardandoBoveda] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [visorPDFAbierto, setVisorPDFAbierto] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [tipoPDFActual, setTipoPDFActual] = useState<'liquidacion' | 'propuesta'>('liquidacion')
  
  // Estados para generar documentos
  const [documentosGenerados, setDocumentosGenerados] = useState(false)
  const [generandoDocumentos, setGenerandoDocumentos] = useState(false)
  const [pdfLiquidacionUrl, setPdfLiquidacionUrl] = useState<string | null>(null)
  const [pdfPropuestaUrl, setPdfPropuestaUrl] = useState<string | null>(null)
  const [calculosGuardados, setCalculosGuardados] = useState(0)
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false)
  
  // Estados para crear caso y asesoría legal
  const [creandoCaso, setCreandoCaso] = useState(false)
  const [casoCreado, setCasoCreado] = useState(false)
  const [folioDelCaso, setFolioDelCaso] = useState<string | null>(null)
  const [errorCaso, setErrorCaso] = useState<string | null>(null)
  
  // Estados para popup de ayuda urgente
  const [mostrarAyudaUrgente, setMostrarAyudaUrgente] = useState(false)
  const [pasoAyuda, setPasoAyuda] = useState<1 | 2>(1)
  
  // Estado para tabs de resultados
  const [tabActiva, setTabActiva] = useState<'liquidacion' | 'juicio' | 'resumen'>('liquidacion')
  
  // Modo basico - sin resumen ni documentos descargables (para usuarios desde login)
  const [modoBasico, setModoBasico] = useState(false)
  
  // Datos del trabajador para documentos
  const [nombreTrabajador, setNombreTrabajador] = useState('')
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [puestoTrabajo, setPuestoTrabajo] = useState('')
  
  // Horario laboral - últimos 30 días
  const [horarioLaboral, setHorarioLaboral] = useState({
    lunes: { entrada: '09:00', salida: '18:00', trabaja: true },
    martes: { entrada: '09:00', salida: '18:00', trabaja: true },
    miercoles: { entrada: '09:00', salida: '18:00', trabaja: true },
    jueves: { entrada: '09:00', salida: '18:00', trabaja: true },
    viernes: { entrada: '09:00', salida: '18:00', trabaja: true },
    sabado: { entrada: '09:00', salida: '14:00', trabaja: false },
    domingo: { entrada: '00:00', salida: '00:00', trabaja: false },
  })
  const [mismoHorarioLunesViernes, setMismoHorarioLunesViernes] = useState(true)
  const [tipoDescanso, setTipoDescanso] = useState<'fijo' | 'rotativo' | 'ninguno'>('fijo')
  const [diaDescansoFijo, setDiaDescansoFijo] = useState('domingo')
  const [tiempoConHorario, setTiempoConHorario] = useState<'ultimo_mes' | 'siempre'>('siempre')
  // Tiempo de comida
  const [tiempoComidaMinutos, setTiempoComidaMinutos] = useState(60)
  const [comidaDentroTrabajo, setComidaDentroTrabajo] = useState(false) // Si es dentro, cuenta como hora extra
  
  // Estado de días de vacaciones y aguinaldo
  const [diasVacacionesPendientes, setDiasVacacionesPendientes] = useState(0)
  const [diasAguinaldo, setDiasAguinaldo] = useState(15)
  
  // Sincronizar salario diario/mensual
  useEffect(() => {
    if (tipoSalario === 'mensual') {
      setSalarioDiario(Math.round(salarioMensual / 30))
    }
  }, [salarioMensual, tipoSalario])
  
  useEffect(() => {
    if (tipoSalario === 'diario') {
      setSalarioMensual(salarioDiario * 30)
    }
  }, [salarioDiario, tipoSalario])
  
  // Función para calcular horas en horario diurno y nocturno de una jornada
  const calcularHorasPorTipo = (entradaH: number, entradaM: number, salidaH: number, salidaM: number) => {
    // Horario diurno: 6:00 - 20:00 | Horario nocturno: 20:00 - 6:00
    const INICIO_DIURNO = 6
    const FIN_DIURNO = 20
    
    const entradaDecimal = entradaH + entradaM / 60
    let salidaDecimal = salidaH + salidaM / 60
    
    // Si la salida es menor que la entrada, cruza medianoche
    if (salidaDecimal <= entradaDecimal) {
      salidaDecimal += 24
    }
    
    let horasDiurnas = 0
    let horasNocturnas = 0
    
    // Recorrer cada hora de la jornada
    let hora = entradaDecimal
    while (hora < salidaDecimal) {
      const horaDelDia = hora % 24
      const siguiente = Math.min(hora + 1, salidaDecimal)
      const fraccion = siguiente - hora
      
      // Determinar si esta hora es diurna o nocturna
      if (horaDelDia >= INICIO_DIURNO && horaDelDia < FIN_DIURNO) {
        horasDiurnas += fraccion
      } else {
        horasNocturnas += fraccion
      }
      
      hora = siguiente
    }
    
    return { horasDiurnas, horasNocturnas }
  }
  
  // Función para calcular horas extras basado en horario laboral
  const calcularHorasExtrasSemana = () => {
    let horasExtraDiurnas = 0
    let horasExtraNocturnas = 0
    let horasComidaDentro = 0
    
    // Jornadas máximas según LFT Art. 61
    const JORNADA_DIURNA_MAX = 8    // 6:00-20:00
    const JORNADA_NOCTURNA_MAX = 7  // 20:00-6:00
    const JORNADA_MIXTA_MAX = 7.5   // Combinación con <= 3.5 hrs nocturnas
    const LIMITE_NOCTURNAS_MIXTA = 3.5 // Si supera esto, se considera nocturna
    
    Object.values(horarioLaboral).forEach(dia => {
      if (!dia || !dia.trabaja) return
      if (!dia.entrada || !dia.salida) return
      
      const entradaParts = dia.entrada.split(':')
      const salidaParts = dia.salida.split(':')
      if (entradaParts.length < 2 || salidaParts.length < 2) return
      
      const entradaH = Number(entradaParts[0]) || 0
      const entradaM = Number(entradaParts[1]) || 0
      const salidaH = Number(salidaParts[0]) || 0
      const salidaM = Number(salidaParts[1]) || 0
      
      // Calcular horas diurnas y nocturnas de esta jornada
      const { horasDiurnas, horasNocturnas } = calcularHorasPorTipo(entradaH, entradaM, salidaH, salidaM)
      let horasTrabajadas = horasDiurnas + horasNocturnas
      
      if (horasTrabajadas <= 0 || Number.isNaN(horasTrabajadas)) return
      
      // Restar tiempo de comida solo si es fuera del trabajo
      if (!comidaDentroTrabajo) {
        horasTrabajadas -= tiempoComidaMinutos / 60
      }
      
      // Determinar tipo de jornada según LFT Art. 60-61
      let tipoJornada: 'diurna' | 'nocturna' | 'mixta'
      let jornadaMaxima: number
      
      if (horasNocturnas === 0) {
        // 100% diurna
        tipoJornada = 'diurna'
        jornadaMaxima = JORNADA_DIURNA_MAX
      } else if (horasDiurnas === 0) {
        // 100% nocturna
        tipoJornada = 'nocturna'
        jornadaMaxima = JORNADA_NOCTURNA_MAX
      } else if (horasNocturnas > LIMITE_NOCTURNAS_MIXTA) {
        // Más de 3.5 hrs nocturnas = se considera nocturna completa
        tipoJornada = 'nocturna'
        jornadaMaxima = JORNADA_NOCTURNA_MAX
      } else {
        // Mixta: tiene ambas pero <= 3.5 hrs nocturnas
        tipoJornada = 'mixta'
        jornadaMaxima = JORNADA_MIXTA_MAX
      }
      
      // Calcular horas extra si excede la jornada máxima
      if (horasTrabajadas > jornadaMaxima) {
        const extras = horasTrabajadas - jornadaMaxima
        
        // Distribuir extras según proporción diurna/nocturna de la jornada
        if (tipoJornada === 'diurna') {
          horasExtraDiurnas += extras
        } else if (tipoJornada === 'nocturna') {
          horasExtraNocturnas += extras
        } else {
          // Mixta: distribuir proporcionalmente
          const proporcionNocturna = horasNocturnas / horasTrabajadas
          horasExtraNocturnas += extras * proporcionNocturna
          horasExtraDiurnas += extras * (1 - proporcionNocturna)
        }
      }
      
      // Si come dentro del trabajo, ese tiempo cuenta como extra (Art. 63 LFT)
      if (comidaDentroTrabajo) {
        horasComidaDentro += tiempoComidaMinutos / 60
        // Asignar según tipo de jornada
        if (tipoJornada === 'nocturna') {
          horasExtraNocturnas += tiempoComidaMinutos / 60
        } else {
          horasExtraDiurnas += tiempoComidaMinutos / 60
        }
      }
    })
    
    return { 
      horasExtraDiurnas: horasExtraDiurnas || 0, 
      horasExtraNocturnas: horasExtraNocturnas || 0, 
      horasComidaDentro: horasComidaDentro || 0,
      totalSemanal: (horasExtraDiurnas || 0) + (horasExtraNocturnas || 0)
    }
  }
  
  const horasExtrasCalc = calcularHorasExtrasSemana()
  
  // Calcular días de vacaciones que corresponden según antigüedad
  const calcularVacacionesCorrespondientes = (anios: number) => {
    return getDiasVacaciones(anios)
  }
  
  // Calcular resultados cuando cambien los datos
  useEffect(() => {
    // Fecha de salida: si sigo laborando, usar fecha actual
    const fechaSalidaCalc = sigoLaborando ? new Date().toISOString().split('T')[0] : fechaSalida
    
    if (!fechaIngreso || !fechaSalidaCalc) return
    
    const salarioDiarioBase = tipoSalario === 'mensual' ? Math.round(salarioMensual / 30) : salarioDiario
    
    // Calcular antigüedad para determinar vacaciones
    const antiguedad = calcularAntiguedad(new Date(fechaIngreso), new Date(fechaSalidaCalc))
    const diasVacacionesCorrespondientes = calcularVacacionesCorrespondientes(antiguedad.anios)
    
    // Días de vacaciones pendientes = correspondientes - tomados
    const diasVacacionesPendientesCalc = Math.max(0, diasVacacionesCorrespondientes - diasVacacionesTomados)
    
    // Calcular prima dominical: 25% del salario diario por cada domingo trabajado
    const primaDominicalMonto = domingosTrabajados * (salarioDiarioBase * 0.25)
    
    // Calcular semanas según opción seleccionada (lo movemos aquí para usar en salario integrado)
    const semanasCalculadas = tiempoConHorario === 'ultimo_mes' 
      ? 4 
      : Math.floor(antiguedad.totalDias / 7)
    
    // Calcular horas extras semanales
    const { totalSemanal: horasExtrasSemanales, horasExtraDiurnas, horasExtraNocturnas } = calcularHorasExtrasSemana()
    
    // Calcular 7mo día trabajado si no tiene descanso (Art. 69 y 73 LFT)
    const septimoDiaMonto = tipoDescanso === 'ninguno' 
      ? semanasCalculadas * salarioDiarioBase * 2 // Se paga doble
      : 0
    
    // Calcular monto de horas extras (Art. 67-68 LFT)
    // Las horas nocturnas valen 20% más que las diurnas (Art. 61 LFT equivalencia)
    const salarioHoraDiurna = salarioDiarioBase / 8
    const salarioHoraNocturna = salarioHoraDiurna * 1.2 // 20% más por ser nocturna
    
    // Horas extras totales por tipo
    const horasExtrasDiurnasTotales = (horasExtraDiurnas || 0) * (semanasCalculadas || 1)
    const horasExtrasNocturnasTotales = (horasExtraNocturnas || 0) * (semanasCalculadas || 1)
    const horasExtrasTotales = horasExtrasDiurnasTotales + horasExtrasNocturnasTotales
    
    // Primeras 9 hrs semanales = doble, adicionales = triple
    const horasDoblesDiurnas = Math.min(horasExtrasDiurnasTotales, 9 * (semanasCalculadas || 1))
    const horasTriplesDiurnas = Math.max(0, horasExtrasDiurnasTotales - horasDoblesDiurnas)
    
    const horasDoblesNocturnas = Math.min(horasExtrasNocturnasTotales, 9 * (semanasCalculadas || 1))
    const horasTriplesNocturnas = Math.max(0, horasExtrasNocturnasTotales - horasDoblesNocturnas)
    
    // Calcular monto: diurnas al doble/triple + nocturnas al doble/triple con 20% adicional
    const montoExtrasDiurnas = (horasDoblesDiurnas * salarioHoraDiurna * 2) + (horasTriplesDiurnas * salarioHoraDiurna * 3)
    const montoExtrasNocturnas = (horasDoblesNocturnas * salarioHoraNocturna * 2) + (horasTriplesNocturnas * salarioHoraNocturna * 3)
    const montoHorasExtras = (montoExtrasDiurnas + montoExtrasNocturnas) || 0
    
    // SALARIO DIARIO INTEGRADO: incluye promedio de extras (Art. 84 LFT)
    // Integrar: horas extras + prima dominical + 7mo día trabajado
    const totalExtras = (montoHorasExtras || 0) + (primaDominicalMonto || 0) + (septimoDiaMonto || 0)
    const extrasIntegrados = totalExtras / Math.max(antiguedad.totalDias, 1)
    const salarioDiarioCalc = Math.round(salarioDiarioBase + (extrasIntegrados || 0)) || salarioDiarioBase
    
    // Aguinaldo adeudado del año anterior
    const aguinaldoAdeudadoAnterior = debenTodoAguinaldoAnterior 
      ? diasAguinaldoEmpresa 
      : diasAguinaldoAdeudadoAnterior
    
    const datos: DatosLiquidacion = {
      salarioDiario: salarioDiarioCalc,
      fechaIngreso: new Date(fechaIngreso),
      fechaSalida: new Date(fechaSalidaCalc),
      diasVacacionesPendientes: diasVacacionesPendientesCalc,
      diasAguinaldo: diasAguinaldoEmpresa,
      primaVacacionalPorcentaje: primaVacacionalPct / 100,
      salariosAdeudadosDias,
      // Campos adicionales para el cálculo extendido
      aguinaldoAdeudadoAnterior,
    } as DatosLiquidacion & { aguinaldoAdeudadoAnterior: number }
    
    const resultado = calcularLiquidacion(datos)
    setResultadoLiquidacion(resultado)
    
    // Resetear estados de documentos generados cuando se hace un nuevo cálculo
    setDocumentosGenerados(false)
    setPdfLiquidacionUrl(null)
    setPdfPropuestaUrl(null)
    setGuardadoExitoso(false)
    
    // Calcular juicio potencial (ya calculamos horas extras arriba)
    const datosJuicio: DatosJuicioPotencial = {
      duracionMeses: duracionJuicio,
      salariosCaidos,
      horasExtraSemanales: horasExtrasSemanales,
      semanasHorasExtra: semanasCalculadas,
      comisionesPendientes,
      primaDominicalAdeudada: primaDominicalMonto + septimoDiaMonto,
      diasFestivosTrabajados,
      diferenciasSalariales,
      otroConcepto1,
      otroConcepto2,
    }
    
    const resultadoJ = calcularJuicioPotencial(datos, datosJuicio, resultado)
    setResultadoJuicio(resultadoJ)
  }, [
    tipoSalario, salarioMensual, salarioDiario, fechaIngreso, fechaSalida, sigoLaborando,
    diasVacacionesTomados, diasAguinaldoEmpresa, diasAguinaldoAdeudadoAnterior, debenTodoAguinaldoAnterior,
    primaVacacionalPct, salariosAdeudadosDias,
    duracionJuicio, salariosCaidos, horarioLaboral, tiempoConHorario, tipoDescanso,
    tiempoComidaMinutos, comidaDentroTrabajo,
    comisionesPendientes, domingosTrabajados, diasFestivosTrabajados,
    diferenciasSalariales, otroConcepto1, otroConcepto2,
  ])
  
  // Helper functions para guardar en localStorage (usuarios guest)
  const guardarDatosLaboralesGuest = (datos: { nombreEmpresa: string; puestoTrabajo: string; fechaIngreso: string }) => {
    try {
      localStorage.setItem('datos_laborales_guest', JSON.stringify(datos))
    } catch (error) {
      console.error('Error guardando datos laborales:', error)
    }
  }
  
  const guardarCalculoGuest = (datos: any) => {
    try {
      const saved = localStorage.getItem('calculos_guest')
      const calculos = saved ? JSON.parse(saved) : []
      calculos.unshift({ ...datos, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
      localStorage.setItem('calculos_guest', JSON.stringify(calculos.slice(0, 3))) // Max 3
    } catch (error) {
      console.error('Error guardando cálculo guest:', error)
    }
  }
  
  // Cargar historial de localStorage
  useEffect(() => {
    const saved = localStorage.getItem('calc_runs_guest')
    if (saved) {
      try {
        setHistorial(JSON.parse(saved))
      } catch {
        // Ignorar errores de parsing
      }
    }
    
    // Detectar modo basico desde URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('modo') === 'basico') {
      setModoBasico(true)
    }
  }, [])
  
  // Guardar cálculo
  const handleGuardar = () => {
    if (!resultadoLiquidacion) return
    
    const run: CalcRun = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      inputs: {
        salarioDiario: tipoSalario === 'mensual' ? Math.round(salarioMensual / 30) : salarioDiario,
        fechaIngreso: new Date(fechaIngreso),
        fechaSalida: sigoLaborando ? new Date() : new Date(fechaSalida),
        diasVacacionesTomados,
        diasAguinaldoEmpresa,
        diasAguinaldoAdeudadoAnterior: debenTodoAguinaldoAnterior ? diasAguinaldoEmpresa : diasAguinaldoAdeudadoAnterior,
        primaVacacionalPorcentaje: primaVacacionalPct / 100,
        salariosAdeudadosDias,
        duracionMeses: duracionJuicio,
        salariosCaidos,
        semanasHorasExtra,
        comisionesPendientes,
        primaDominicalMonto: domingosTrabajados * (salarioDiario * 0.25),
        diasFestivosTrabajados,
        diferenciasSalariales,
        otroConcepto1,
        otroConcepto2,
      },
      results: {
        liquidacion: resultadoLiquidacion,
        juicio: resultadoJuicio || undefined,
      },
      mode: resultadoJuicio ? 'juicio' : 'liquidacion',
    }
    
    const newHistorial = [run, ...historial].slice(0, 5) // máximo 5
    setHistorial(newHistorial)
    localStorage.setItem('calc_runs_guest', JSON.stringify(newHistorial))
    
    // Toast simple
    alert('Guardado en este dispositivo')
  }
  
  // Preparar datos para el PDF
  const prepararDatosPDF = () => {
    if (!resultadoLiquidacion) return null
    
    const salarioDiarioCalc = tipoSalario === 'mensual' ? Math.round(salarioMensual / 30) : salarioDiario
    const netoConciliacion = resultadoLiquidacion.totalBruto * 0.75
    const netoJuicio = resultadoJuicio ? resultadoJuicio.totalPotencial * 0.65 : 0
    const diferencia = netoJuicio - netoConciliacion
    const porcentajeAumento = netoConciliacion > 0 ? Math.round((diferencia / netoConciliacion) * 100) : 0
    
    return {
      // Datos del trabajador y empresa
      nombreTrabajador: nombreTrabajador || undefined,
      nombreEmpresa: nombreEmpresa || undefined,
      puestoTrabajo: puestoTrabajo || undefined,
      fechaIngreso: fechaIngreso,
      fechaSalida: sigoLaborando ? new Date().toISOString().split('T')[0] : fechaSalida,
      salarioDiario: salarioDiarioCalc,
      salarioMensual: tipoSalario === 'mensual' ? salarioMensual : salarioDiario * 30,
      antiguedadAnios: resultadoLiquidacion.antiguedadAnios,
      antiguedadMeses: resultadoLiquidacion.antiguedadMeses || 0,
      antiguedadDias: resultadoLiquidacion.antiguedadDias,
      
      // Conciliación
      indemnizacionConstitucional: resultadoLiquidacion.indemnizacionConstitucional,
      indemnizacionAntiguedad: resultadoLiquidacion.indemnizacionAntiguedad,
      primaAntiguedad: resultadoLiquidacion.primaAntiguedad,
      vacacionesPendientes: resultadoLiquidacion.vacacionesPendientes || 0,
      vacacionesProporcionales: resultadoLiquidacion.vacacionesProporcionales || 0,
      diasVacacionesProporcionales: resultadoLiquidacion.diasVacacionesProporcionales || 0,
      primaVacacional: resultadoLiquidacion.primaVacacional || 0,
      aguinaldoProporcional: resultadoLiquidacion.aguinaldoProporcional,
      salariosAdeudados: resultadoLiquidacion.salariosAdeudados,
      totalBrutoConciliacion: resultadoLiquidacion.totalBruto,
      honorariosConciliacion: resultadoLiquidacion.totalBruto * 0.25,
      netoConciliacion,
      
      // Juicio
      salariosCaidos: resultadoJuicio?.salariosCaidosMonto || 0,
      horasExtra: resultadoJuicio?.horasExtraMonto || 0,
      primaDominical: resultadoJuicio?.primaDominicalMonto || 0,
      diasFestivos: resultadoJuicio?.diasFestivosMonto || 0,
      comisiones: resultadoJuicio?.comisionesMonto || 0,
      totalBrutoJuicio: resultadoJuicio?.totalPotencial || 0,
      honorariosJuicio: (resultadoJuicio?.totalPotencial || 0) * 0.35,
      netoJuicio,
      duracionJuicioMeses: duracionJuicio,
      
      // Comparativo
      diferencia: Math.max(0, diferencia),
      porcentajeAumento: Math.max(0, porcentajeAumento),
    }
  }
  
  // Generar y descargar PDF infográfico
  const handleDescargarPDF = async () => {
    const datosPDF = prepararDatosPDF()
    if (!datosPDF) return
    
    setDescargandoPDF(true)
    try {
      downloadLiquidacionPDF(datosPDF, `mi-liquidacion-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF')
    } finally {
      setDescargandoPDF(false)
    }
  }
  
  // Cerrar visor PDF
  const handleCerrarVisorPDF = () => {
    setVisorPDFAbierto(false)
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl)
      setPdfBlobUrl(null)
    }
  }
  
  // Helper para convertir blob a base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const base64 = dataUrl.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  
  // Verificar límites al cargar
  useEffect(() => {
    const verificarLimites = async () => {
      const result = await verificarLimiteCalculos()
      if (result.success) {
        setCalculosGuardados(result.conteo)
        setLimiteAlcanzado(!result.puedeGuardar)
      }
    }
    verificarLimites()
  }, [guardadoExitoso])
  
  // Generar ambos documentos PDF
  const handleGenerarDocumentos = async () => {
    if (!nombreEmpresa.trim()) {
      alert('Por favor ingresa el nombre de la empresa para identificar tu cálculo')
      return
    }
    
    const datosPDF = prepararDatosPDF()
    const datosPropuesta = prepararDatosPropuestaEmpresa()
    
    if (!datosPDF || !datosPropuesta) return
    
    setGenerandoDocumentos(true)
    
    try {
      // Generar ambos PDFs
      const pdfLiquidacion = getLiquidacionPDFBlob(datosPDF)
      const pdfPropuesta = getPropuestaEmpresaPDFBlob(datosPropuesta)
      
      // Crear URLs para visualización
      const urlLiquidacion = URL.createObjectURL(pdfLiquidacion)
      const urlPropuesta = URL.createObjectURL(pdfPropuesta)
      
      setPdfLiquidacionUrl(urlLiquidacion)
      setPdfPropuestaUrl(urlPropuesta)
      setDocumentosGenerados(true)
      
      // Verificar límites
      const limites = await verificarLimiteCalculos()
      if (limites.success) {
        setCalculosGuardados(limites.conteo)
        setLimiteAlcanzado(!limites.puedeGuardar)
      }
    } catch (error) {
      console.error('Error generando documentos:', error)
      alert('Error al generar los documentos')
    } finally {
      setGenerandoDocumentos(false)
    }
  }
  
  // Guardar PDF en la bóveda de Supabase
  const handleGuardarEnBoveda = async () => {
    // Verificar límites primero
    const limites = await verificarLimiteCalculos()
    
    if (limites.requiresAuth) {
      window.location.href = '/acceso?redirect=/calculadora'
      return
    }
    
    if (!limites.puedeGuardar) {
      setLimiteAlcanzado(true)
      alert(`Has alcanzado el límite de ${limites.limite} cálculos guardados. Actualiza tu cuenta para guardar más.`)
      return
    }
    
    const datosPDF = prepararDatosPDF()
    const datosPropuesta = prepararDatosPropuestaEmpresa()
    if (!datosPDF || !datosPropuesta) return
    
    setGuardandoBoveda(true)
    setGuardadoExitoso(false)
    
    try {
      // Generar ambos PDFs como blob
      const pdfLiquidacionBlob = getLiquidacionPDFBlob(datosPDF)
      const pdfPropuestaBlob = getPropuestaEmpresaPDFBlob(datosPropuesta)
      
      // Convertir blobs a base64
      const base64Liquidacion = await blobToBase64(pdfLiquidacionBlob)
      const base64Propuesta = await blobToBase64(pdfPropuestaBlob)
      
      // Calcular días de salarios caídos desde el despido
      const fechaDespido = new Date(datosPDF.fechaSalida)
      const hoy = new Date()
      const diasSalariosCaidos = Math.floor((hoy.getTime() - fechaDespido.getTime()) / (1000 * 60 * 60 * 24))
      
      const result = await guardarCalculoEnBoveda({
        pdfLiquidacionBlob: base64Liquidacion,
        pdfPropuestaBlob: base64Propuesta,
        datosCalculo: {
          nombreEmpresa: nombreEmpresa || 'Sin nombre',
          nombreTrabajador,
          puestoTrabajo,
          salarioDiario: datosPDF.salarioDiario,
          salarioMensual: datosPDF.salarioMensual,
          fechaIngreso: datosPDF.fechaIngreso,
          fechaSalida: datosPDF.fechaSalida,
          fechaDespido: datosPDF.fechaSalida,
          totalConciliacion: datosPDF.netoConciliacion,
          totalJuicio: datosPDF.netoJuicio,
          totalJuicioBase: datosPDF.netoJuicio,
          antiguedadAnios: datosPDF.antiguedadAnios,
          antiguedadMeses: datosPDF.antiguedadMeses,
          antiguedadDias: datosPDF.antiguedadDias,
          diasSalariosCaidosAlGuardar: diasSalariosCaidos,
        }
      })
      
      if (result.success) {
        setGuardadoExitoso(true)
        setCalculosGuardados(prev => prev + 1)
        
        // Guardar datos laborales en localStorage para perfil guest
        guardarDatosLaboralesGuest({
          nombreEmpresa: nombreEmpresa || 'Sin nombre',
          puestoTrabajo: puestoTrabajo || 'Sin especificar',
          fechaIngreso: datosPDF.fechaIngreso
        })
        
        setTimeout(() => setGuardadoExitoso(false), 5000)
      } else if (result.requiresAuth) {
        // Para usuarios guest, guardar en localStorage
        guardarCalculoGuest({
          nombreEmpresa: nombreEmpresa || 'Sin nombre',
          puestoTrabajo: puestoTrabajo || 'Sin especificar',
          fechaIngreso: datosPDF.fechaIngreso,
          fechaSalida: datosPDF.fechaSalida,
          salarioDiario: datosPDF.salarioDiario,
          totalConciliacion: datosPDF.netoConciliacion,
          totalJuicio: datosPDF.netoJuicio,
        })
        setGuardadoExitoso(true)
        setCalculosGuardados(prev => Math.min(prev + 1, 3))
        setTimeout(() => setGuardadoExitoso(false), 5000)
      } else {
        alert(result.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error guardando en bóveda:', error)
      alert('Error al guardar en la bóveda')
    } finally {
      setGuardandoBoveda(false)
    }
  }
  
  // Solicitar asesoría legal (abre modal o crea caso)
  const handleSolicitarAsesoria = () => {
    setMostrarAyudaUrgente(true)
    setPasoAyuda(1)
  }
  
  // Crear caso + generar cálculo + guardar en bóveda
  const handleCrearCaso = async () => {
    const datosPDF = prepararDatosPDF()
    if (!datosPDF) return
    
    setCreandoCaso(true)
    setErrorCaso(null)
    
    try {
      // 1. Primero generar los documentos PDF
      if (!documentosGenerados) {
        await handleGenerarDocumentos()
      }
      
      // Calcular días de salarios caídos desde el despido
      const fechaDespido = new Date(datosPDF.fechaSalida)
      const hoy = new Date()
      const diasSalariosCaidos = Math.floor((hoy.getTime() - fechaDespido.getTime()) / (1000 * 60 * 60 * 24))
      
      // 2. Guardar en la bóveda del usuario
      const resultBoveda = await guardarCalculoEnBoveda({
        nombreEmpresa: nombreEmpresa || 'Sin nombre',
        nombreTrabajador,
        puestoTrabajo,
        salarioDiario: datosPDF.salarioDiario,
        salarioMensual: datosPDF.salarioMensual,
        fechaIngreso: datosPDF.fechaIngreso,
        fechaSalida: datosPDF.fechaSalida,
        fechaDespido: datosPDF.fechaSalida,
        totalConciliacion: datosPDF.netoConciliacion,
        totalJuicio: datosPDF.netoJuicio,
        totalJuicioBase: datosPDF.netoJuicio,
        antiguedadAnios: datosPDF.antiguedadAnios,
        antiguedadMeses: datosPDF.antiguedadMeses,
        antiguedadDias: datosPDF.antiguedadDias,
        diasSalariosCaidosAlGuardar: diasSalariosCaidos,
      })
      
      if (resultBoveda.success) {
        setGuardadoExitoso(true)
        setCalculosGuardados(prev => prev + 1)
      }
      
      // 3. Crear el caso legal
      const result = await crearCasoDesdeCalculo({
        datosCalculo: {
          nombreEmpresa: nombreEmpresa || 'Sin nombre',
          nombreTrabajador,
          puestoTrabajo,
          salarioDiario: datosPDF.salarioDiario,
          salarioMensual: datosPDF.salarioMensual,
          fechaIngreso: datosPDF.fechaIngreso,
          fechaSalida: datosPDF.fechaSalida,
          totalConciliacion: datosPDF.netoConciliacion,
          totalJuicio: datosPDF.netoJuicio,
          antiguedadAnios: datosPDF.antiguedadAnios,
          antiguedadMeses: datosPDF.antiguedadMeses,
          antiguedadDias: datosPDF.antiguedadDias,
        }
      })
      
      if (result.success) {
        setCasoCreado(true)
        setFolioDelCaso(result.folio || null)
      } else if (result.requiresAuth) {
        window.location.href = '/acceso?redirect=/calculadora'
      } else {
        setErrorCaso(result.error || 'Error al crear el caso')
      }
    } catch (error) {
      console.error('Error creando caso:', error)
      setErrorCaso('Error inesperado al solicitar asesoría')
    } finally {
      setCreandoCaso(false)
    }
  }
  
  // Preparar datos para PDF de propuesta empresa
  const prepararDatosPropuestaEmpresa = (): DatosPropuestaEmpresa | null => {
    if (!resultadoLiquidacion) return null
    
    const salarioDiarioCalc = tipoSalario === 'mensual' ? Math.round(salarioMensual / 30) : salarioDiario
    const antiguedad = calcularAntiguedad(new Date(fechaIngreso), new Date(sigoLaborando ? new Date() : fechaSalida))
    
    return {
      nombreTrabajador,
      nombreEmpresa: nombreEmpresa || 'No especificada',
      puestoTrabajo,
      fechaIngreso,
      fechaSalida: sigoLaborando ? new Date().toISOString().split('T')[0] : fechaSalida,
      salarioDiario: salarioDiarioCalc,
      salarioMensual: tipoSalario === 'mensual' ? salarioMensual : salarioDiario * 30,
      antiguedadAnios: antiguedad.anios,
      antiguedadMeses: antiguedad.meses,
      antiguedadDias: antiguedad.dias,
      
      // Conciliación
      indemnizacionConstitucional: resultadoLiquidacion.indemnizacionConstitucional,
      indemnizacionAntiguedad: resultadoLiquidacion.indemnizacionAntiguedad,
      primaAntiguedad: resultadoLiquidacion.primaAntiguedad,
      vacacionesPendientes: resultadoLiquidacion.vacacionesPendientes || 0,
      vacacionesProporcionales: resultadoLiquidacion.vacacionesProporcionales || 0,
      diasVacacionesProporcionales: resultadoLiquidacion.diasVacacionesProporcionales || 0,
      primaVacacional: resultadoLiquidacion.primaVacacional || 0,
      aguinaldoProporcional: resultadoLiquidacion.aguinaldoProporcional,
      salariosAdeudados: resultadoLiquidacion.salariosAdeudados,
      totalConciliacion: resultadoLiquidacion.totalBruto,
      
      // Juicio
      salariosCaidos: resultadoJuicio?.salariosCaidosMonto || 0,
      horasExtra: resultadoJuicio?.horasExtraMonto || 0,
      primaDominical: resultadoJuicio?.primaDominicalMonto || 0,
      diasFestivos: resultadoJuicio?.diasFestivosMonto || 0,
      totalJuicio: resultadoJuicio?.totalPotencial || resultadoLiquidacion.totalBruto,
      
      // Comparativo
      diferencia: (resultadoJuicio?.totalPotencial || 0) - resultadoLiquidacion.totalBruto,
      porcentajeAhorro: resultadoLiquidacion.totalBruto > 0 
        ? Math.round((((resultadoJuicio?.totalPotencial || 0) - resultadoLiquidacion.totalBruto) / resultadoLiquidacion.totalBruto) * 100)
        : 0,
      duracionJuicioMeses: duracionJuicio,
    }
  }
  
  // Visualizar propuesta empresa
  const handleVisualizarPropuestaEmpresa = () => {
    const datos = prepararDatosPropuestaEmpresa()
    if (!datos) return
    
    try {
      const pdfBlob = getPropuestaEmpresaPDFBlob(datos)
      const url = URL.createObjectURL(pdfBlob)
      setPdfBlobUrl(url)
      setTipoPDFActual('propuesta')
      setVisorPDFAbierto(true)
    } catch (error) {
      console.error('Error generando propuesta:', error)
      alert('Error al generar el documento')
    }
  }
  
  // Descargar propuesta empresa
  const handleDescargarPropuestaEmpresa = () => {
    const datos = prepararDatosPropuestaEmpresa()
    if (!datos) return
    
    try {
      downloadPropuestaEmpresaPDF(datos, `propuesta-convenio-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error descargando propuesta:', error)
      alert('Error al descargar el documento')
    }
  }
  
  // Actualizar handleVisualizarPDF para marcar tipo
  const handleVisualizarPDFLiquidacion = () => {
    const datosPDF = prepararDatosPDF()
    if (!datosPDF) return
    
    try {
      const pdfBlob = getLiquidacionPDFBlob(datosPDF)
      const url = URL.createObjectURL(pdfBlob)
      setPdfBlobUrl(url)
      setTipoPDFActual('liquidacion')
      setVisorPDFAbierto(true)
    } catch (error) {
      console.error('Error generando PDF para visualizar:', error)
      alert('Error al generar el PDF')
    }
  }
  
  // Alias para compatibilidad
  const handleVisualizarPDF = handleVisualizarPDFLiquidacion
  
  const today = new Date().toISOString().split('T')[0]
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-primary sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-destructive font-bold text-sm sm:text-lg">!m!</span>
            </div>
            <span className="text-sm sm:text-lg font-semibold text-foreground hidden sm:inline">Calculadora</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <AyudaUrgenteButton className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9" />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Título y disclaimer */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Calcula tu Liquidación
          </h1>
          <p className="text-sm text-muted-foreground">
            Estimación basada en la Ley Federal del Trabajo
          </p>
          <Badge variant="secondary" className="mt-2">Herramienta gratuita</Badge>
        </div>
        
        {/* Tabs */}
        <Tabs value={tabActiva} onValueChange={(v) => {
          setTabActiva(v as 'liquidacion' | 'juicio' | 'resumen')
          // Scroll to top cuando cambia de tab
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="liquidacion" className="gap-1 text-xs sm:text-sm">
              <Calculator className="w-4 h-4 hidden sm:inline" />
              Liquidación
            </TabsTrigger>
            <TabsTrigger value="juicio" className="gap-1 text-xs sm:text-sm">
              <Scale className="w-4 h-4 hidden sm:inline" />
              Juicio
            </TabsTrigger>
{!modoBasico && (
                  <TabsTrigger value="resumen" className="gap-1 text-xs sm:text-sm">
                    <FileText className="w-4 h-4 hidden sm:inline" />
                    Resumen
                  </TabsTrigger>
                )}
              </TabsList>
          
          {/* Tab Liquidación */}
          <TabsContent value="liquidacion" className="space-y-6">
            {/* Salario */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tu salario</CardTitle>
                <CardDescription>Desliza para ajustar tu salario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nota importante sobre qué incluir */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Suma TODO lo que ganabas
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Incluye: salario base + propinas + vales + comisiones + bonos + cualquier pago regular que recibieras. Art. 84 LFT: El salario integrado incluye todas las prestaciones.
                  </p>
                </div>
                
                <OptionChips
                  options={[
                    { value: 'mensual', label: 'Mensual' },
                    { value: 'diario', label: 'Diario' },
                  ]}
                  value={tipoSalario}
                  onChange={(v) => setTipoSalario(v as 'diario' | 'mensual')}
                />
                
                {tipoSalario === 'mensual' ? (
                  <MoneySlider
                    value={salarioMensual}
                    onChange={setSalarioMensual}
                    min={Math.round(SALARIO_MINIMO_GENERAL_2025 * 30)}
                    max={rangoExtendido ? 500000 : 100000}
                    step={1}
                    label="Salario mensual bruto (todo incluido)"
                  />
                ) : (
                  <MoneySlider
                    value={salarioDiario}
                    onChange={setSalarioDiario}
                    min={Math.round(SALARIO_MINIMO_GENERAL_2025)}
                    max={rangoExtendido ? 16667 : 3334}
                    step={1}
                    label="Salario diario (todo incluido)"
                  />
                )}
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border">
                  <Checkbox
                    id="rangoExtendido"
                    checked={rangoExtendido}
                    onCheckedChange={(checked) => setRangoExtendido(checked === true)}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <label
                      htmlFor="rangoExtendido"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Gano mas de $100,000 al mes
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Ampliar rango hasta $500,000
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Datos del trabajador */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos para documentos</CardTitle>
                <CardDescription>Para identificar tu caso y generar la propuesta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreEmpresa">Nombre de la empresa *</Label>
                  <Input
                    id="nombreEmpresa"
                    placeholder="Ej: Comercializadora ABC S.A. de C.V."
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Este nombre identificará tu cálculo en la bóveda</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreTrabajador">Tu nombre completo</Label>
                    <Input
                      id="nombreTrabajador"
                      placeholder="Ej: Juan Pérez García"
                      value={nombreTrabajador}
                      onChange={(e) => setNombreTrabajador(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="puestoTrabajo">Puesto de trabajo</Label>
                    <Input
                      id="puestoTrabajo"
                      placeholder="Ej: Gerente de ventas"
                      value={puestoTrabajo}
                      onChange={(e) => setPuestoTrabajo(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fechas laborales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DateInput
                    value={fechaIngreso}
                    onChange={setFechaIngreso}
                    label="Fecha de ingreso"
                    max={today}
                  />
                  {!sigoLaborando && (
                    <DateInput
                      value={fechaSalida}
                      onChange={setFechaSalida}
                      label="Fecha de salida"
                      min={fechaIngreso}
                      max={today}
                    />
                  )}
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Checkbox
                    id="sigoLaborando"
                    checked={sigoLaborando}
                    onCheckedChange={(checked) => setSigoLaborando(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="sigoLaborando"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Sigo laborando actualmente
                    </label>
                    <p className="text-xs text-muted-foreground">
                      El cálculo usará la fecha de hoy como fecha de salida
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Prestaciones pendientes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prestaciones pendientes</CardTitle>
                <CardDescription>El sistema calculará lo que te deben</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* VACACIONES */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Vacaciones</Label>
                  <NumberStepper
                    value={diasVacacionesTomados}
                    onChange={setDiasVacacionesTomados}
                    min={0}
                    max={60}
                    label="Dias de vacaciones que YA tomaste este año"
                    suffix="dias"
                  />
                  {fechaIngreso && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        Segun tu antiguedad te corresponden: <strong>{calcularVacacionesCorrespondientes(
                          calcularAntiguedad(
                            new Date(fechaIngreso), 
                            sigoLaborando ? new Date() : (fechaSalida ? new Date(fechaSalida) : new Date())
                          ).anios
                        )} dias</strong>
                      </p>
                      <p className="text-xs font-medium text-primary mt-1">
                        Dias pendientes por pagar: {Math.max(0, calcularVacacionesCorrespondientes(
                          calcularAntiguedad(
                            new Date(fechaIngreso), 
                            sigoLaborando ? new Date() : (fechaSalida ? new Date(fechaSalida) : new Date())
                          ).anios
                        ) - diasVacacionesTomados)} dias
                      </p>
                    </div>
                  )}
                  
                  <NumberStepper
                    value={primaVacacionalPct}
                    onChange={setPrimaVacacionalPct}
                    min={25}
                    max={100}
                    step={5}
                    label="Prima vacacional de tu empresa"
                    suffix="%"
                  />
                </div>
                
                <Separator />
                
                {/* AGUINALDO */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Aguinaldo</Label>
                  <NumberStepper
                    value={diasAguinaldoEmpresa}
                    onChange={setDiasAguinaldoEmpresa}
                    min={15}
                    max={90}
                    label="Dias de aguinaldo que paga tu empresa"
                    suffix="dias"
                  />
                  <p className="text-xs text-muted-foreground -mt-2">
                    Minimo por ley: 15 dias. Algunas empresas pagan mas.
                  </p>
                  
                  <Separator className="my-2" />
                  
                  <p className="text-xs font-medium">Aguinaldo adeudado del año pasado:</p>
                  
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <Checkbox
                      id="debenTodoAguinaldo"
                      checked={debenTodoAguinaldoAnterior}
                      onCheckedChange={(checked) => {
                        setDebenTodoAguinaldoAnterior(checked === true)
                        if (checked) setDiasAguinaldoAdeudadoAnterior(0)
                      }}
                    />
                    <label htmlFor="debenTodoAguinaldo" className="text-sm cursor-pointer">
                      Me deben TODO el aguinaldo del año pasado
                    </label>
                  </div>
                  
                  {!debenTodoAguinaldoAnterior && (
                    <NumberStepper
                      value={diasAguinaldoAdeudadoAnterior}
                      onChange={setDiasAguinaldoAdeudadoAnterior}
                      min={0}
                      max={diasAguinaldoEmpresa}
                      label="Dias de aguinaldo que te deben del año pasado"
                      suffix="dias"
                    />
                  )}
                  
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      El sistema calculará automaticamente el <strong>aguinaldo proporcional</strong> del presente año segun tu fecha de ingreso/salida.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <NumberStepper
                  value={salariosAdeudadosDias}
                  onChange={setSalariosAdeudadosDias}
                  min={0}
                  max={90}
                  label="Dias de salario adeudados"
                  suffix="dias"
                />
              </CardContent>
            </Card>
            
            {/* Resultados liquidación */}
            {resultadoLiquidacion && (
              <Card className="border-primary">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg text-primary">Resultado estimado</CardTitle>
                  <CardDescription>
                    Antigüedad: {resultadoLiquidacion.antiguedadAnios} años, {resultadoLiquidacion.antiguedadDias} días
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span>Indemnizacion constitucional</span>
                      <span className="text-xs text-primary ml-2 font-mono">Art. 48, 50 LFT</span>
                    </div>
                    <span className="font-medium">{formatMXN(resultadoLiquidacion.indemnizacionConstitucional)}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span>Indemnizacion antiguedad</span>
                      <span className="text-xs text-primary ml-2 font-mono">Art. 50-II LFT</span>
                    </div>
                    <span className="font-medium">{formatMXN(resultadoLiquidacion.indemnizacionAntiguedad)}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span>Prima de antiguedad</span>
                      <span className="text-xs text-primary ml-2 font-mono">Art. 162 LFT</span>
                    </div>
                    <span className="font-medium">{formatMXN(resultadoLiquidacion.primaAntiguedad)}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span>Vacaciones + prima</span>
                      <span className="text-xs text-primary ml-2 font-mono">Art. 76, 80 LFT</span>
                    </div>
                    <span className="font-medium">{formatMXN(
                      (resultadoLiquidacion.vacacionesPendientes || 0) + 
                      (resultadoLiquidacion.vacacionesProporcionales || 0) + 
                      (resultadoLiquidacion.primaVacacional || 0)
                    )}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span>Aguinaldo proporcional</span>
                      <span className="text-xs text-primary ml-2 font-mono">Art. 87 LFT</span>
                    </div>
                    <span className="font-medium">{formatMXN(resultadoLiquidacion.aguinaldoProporcional)}</span>
                  </div>
                  {resultadoLiquidacion.salariosAdeudados > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <div>
                        <span>Salarios adeudados</span>
                        <span className="text-xs text-primary ml-2 font-mono">Art. 88 LFT</span>
                      </div>
                      <span className="font-medium">{formatMXN(resultadoLiquidacion.salariosAdeudados)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total bruto</span>
                    <span>{formatMXN(resultadoLiquidacion.totalBruto)}</span>
                  </div>
                  
                  {/* Transparencia en costos */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium">Honorarios legales:</p>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Conciliación (25%)</span>
                      <span>-{formatMXN(resultadoLiquidacion.totalBruto * 0.25)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Juicio/Sentencia (35%)</span>
                      <span>-{formatMXN(resultadoLiquidacion.totalBruto * 0.35)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
                    <span>Neto estimado (conciliación)</span>
                    <span>{formatMXN(resultadoLiquidacion.totalBruto * 0.75)}</span>
                  </div>
                  
                  {/* Botón para ir a Estimación en Juicio */}
                  <Button 
                    variant="destructive"
                    className="w-full mt-4 gap-2"
                    onClick={() => {
                      setTabActiva('juicio')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <Scale className="w-4 h-4" />
                    Estimación en Juicio
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Juicio Potencial */}
          <TabsContent value="juicio" className="space-y-6">
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-lg">Potencial si vas a juicio</CardTitle>
                <CardDescription>
                  Estos montos adicionales se podrían obtener si hay sentencia favorable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <OptionChips
                  label="Duración estimada del juicio"
                  options={[
                    { value: 3, label: '3 meses' },
                    { value: 6, label: '6 meses' },
                    { value: 9, label: '9 meses' },
                    { value: 12, label: '12 meses' },
                    { value: 18, label: '18 meses' },
                    { value: 24, label: '24 meses' },
                  ]}
                  value={duracionJuicio}
                  onChange={(v) => setDuracionJuicio(v as number)}
                />
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Salarios caídos</Label>
                    <p className="text-xs text-muted-foreground">
                      Salarios que debiste recibir durante el juicio
                    </p>
                  </div>
                  <Switch
                    checked={salariosCaidos}
                    onCheckedChange={setSalariosCaidos}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Tu horario laboral (ultimos 30 dias)</Label>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Captura tu horario real. LFT: Jornada diurna max 8hrs (6-20h), nocturna max 7hrs (20-6h)
                  </p>
                  
                  {/* Checkbox mismo horario L-V */}
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Checkbox
                      id="mismoHorario"
                      checked={mismoHorarioLunesViernes}
                      onCheckedChange={(checked) => {
                        setMismoHorarioLunesViernes(checked === true)
                        if (checked) {
                          // Copiar horario del lunes a martes-viernes
                          const horarioLunes = horarioLaboral.lunes
                          setHorarioLaboral(prev => ({
                            ...prev,
                            martes: { ...horarioLunes },
                            miercoles: { ...horarioLunes },
                            jueves: { ...horarioLunes },
                            viernes: { ...horarioLunes },
                          }))
                        }
                      }}
                    />
                    <label htmlFor="mismoHorario" className="text-sm cursor-pointer">
                      Mismo horario de lunes a viernes
                    </label>
                  </div>
                  
                  {/* Horario L-V (si es mismo) */}
                  {mismoHorarioLunesViernes ? (
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <p className="text-sm font-medium mb-3">Horario Lunes a Viernes</p>
                      <div className="grid grid-cols-2 gap-4">
                        <TimePicker
                          label="Entrada"
                          value={horarioLaboral.lunes.entrada}
                          onChange={(entrada) => {
                            setHorarioLaboral(prev => ({
                              ...prev,
                              lunes: { ...prev.lunes, entrada },
                              martes: { ...prev.martes, entrada },
                              miercoles: { ...prev.miercoles, entrada },
                              jueves: { ...prev.jueves, entrada },
                              viernes: { ...prev.viernes, entrada },
                            }))
                          }}
                        />
                        <TimePicker
                          label="Salida"
                          value={horarioLaboral.lunes.salida}
                          onChange={(salida) => {
                            setHorarioLaboral(prev => ({
                              ...prev,
                              lunes: { ...prev.lunes, salida },
                              martes: { ...prev.martes, salida },
                              miercoles: { ...prev.miercoles, salida },
                              jueves: { ...prev.jueves, salida },
                              viernes: { ...prev.viernes, salida },
                            }))
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Horario individual por día L-V
                    <div className="space-y-3">
                      {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const).map(dia => (
                        <div key={dia} className="p-3 rounded-lg border bg-muted/30">
                          <p className="text-sm font-medium capitalize mb-2">{dia}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <TimePicker
                              label="Entrada"
                              value={horarioLaboral[dia].entrada}
                              onChange={(entrada) => setHorarioLaboral(prev => ({
                                ...prev,
                                [dia]: { ...prev[dia], entrada }
                              }))}
                            />
                            <TimePicker
                              label="Salida"
                              value={horarioLaboral[dia].salida}
                              onChange={(salida) => setHorarioLaboral(prev => ({
                                ...prev,
                                [dia]: { ...prev[dia], salida }
                              }))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Sabado */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        id="trabajaSabado"
                        checked={horarioLaboral.sabado.trabaja}
                        onCheckedChange={(checked) => setHorarioLaboral(prev => ({
                          ...prev,
                          sabado: { ...prev.sabado, trabaja: checked === true }
                        }))}
                      />
                      <label htmlFor="trabajaSabado" className="text-sm font-medium">Trabajo los sabados</label>
                    </div>
                    {horarioLaboral.sabado.trabaja && (
                      <div className="grid grid-cols-2 gap-3 ml-6">
                        <TimePicker
                          label="Entrada"
                          value={horarioLaboral.sabado.entrada}
                          onChange={(entrada) => setHorarioLaboral(prev => ({
                            ...prev,
                            sabado: { ...prev.sabado, entrada }
                          }))}
                        />
                        <TimePicker
                          label="Salida"
                          value={horarioLaboral.sabado.salida}
                          onChange={(salida) => setHorarioLaboral(prev => ({
                            ...prev,
                            sabado: { ...prev.sabado, salida }
                          }))}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Domingo */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        id="trabajaDomingo"
                        checked={horarioLaboral.domingo.trabaja}
                        onCheckedChange={(checked) => setHorarioLaboral(prev => ({
                          ...prev,
                          domingo: { ...prev.domingo, trabaja: checked === true }
                        }))}
                      />
                      <label htmlFor="trabajaDomingo" className="text-sm font-medium">Trabajo los domingos</label>
                    </div>
                    {horarioLaboral.domingo.trabaja && (
                      <div className="grid grid-cols-2 gap-3 ml-6">
                        <TimePicker
                          label="Entrada"
                          value={horarioLaboral.domingo.entrada}
                          onChange={(entrada) => setHorarioLaboral(prev => ({
                            ...prev,
                            domingo: { ...prev.domingo, entrada }
                          }))}
                        />
                        <TimePicker
                          label="Salida"
                          value={horarioLaboral.domingo.salida}
                          onChange={(salida) => setHorarioLaboral(prev => ({
                            ...prev,
                            domingo: { ...prev.domingo, salida }
                          }))}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Tiempo de comida */}
                  <div className="p-4 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <p className="text-sm font-medium mb-3">Tiempo para comer</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Art. 63 LFT: Minimo 30 minutos. Si comes DENTRO del trabajo, ese tiempo cuenta como jornada laboral.
                    </p>
                    <div className="space-y-3">
                      <OptionChips
                        options={[
                          { value: 30, label: '30 min' },
                          { value: 60, label: '1 hora' },
                          { value: 90, label: '1.5 hrs' },
                          { value: 120, label: '2 hrs' },
                        ]}
                        value={tiempoComidaMinutos}
                        onChange={(v) => setTiempoComidaMinutos(v as number)}
                      />
                      
                      <div className="flex items-center space-x-3 p-3 rounded bg-background border">
                        <Checkbox
                          id="comidaDentro"
                          checked={comidaDentroTrabajo}
                          onCheckedChange={(checked) => setComidaDentroTrabajo(checked === true)}
                        />
                        <div>
                          <label htmlFor="comidaDentro" className="text-sm font-medium cursor-pointer">
                            Como dentro del lugar de trabajo
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Si no puedes salir, ese tiempo es hora extra
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dia de descanso */}
                  <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                    <p className="text-sm font-medium mb-2">Dia de descanso semanal</p>
                    <p className="text-xs text-muted-foreground mb-3">Art. 69 LFT: Todo trabajador tiene derecho a un dia de descanso por cada 6 de trabajo</p>
                    <OptionChips
                      options={[
                        { value: 'fijo', label: 'Fijo' },
                        { value: 'rotativo', label: 'Rotativo' },
                        { value: 'ninguno', label: 'No tengo descanso' },
                      ]}
                      value={tipoDescanso}
                      onChange={(v) => setTipoDescanso(v as 'fijo' | 'rotativo' | 'ninguno')}
                    />
                    {tipoDescanso === 'fijo' && (
                      <div className="mt-3">
                        <OptionChips
                          options={[
                            { value: 'domingo', label: 'Dom' },
                            { value: 'sabado', label: 'Sab' },
                            { value: 'lunes', label: 'Lun' },
                            { value: 'otro', label: 'Otro' },
                          ]}
                          value={diaDescansoFijo}
                          onChange={(v) => setDiaDescansoFijo(v as string)}
                        />
                      </div>
                    )}
                    {tipoDescanso === 'rotativo' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        El descanso rotativo puede implicar trabajo en dias festivos sin pago extra. Art. 71 LFT
                      </p>
                    )}
                    {tipoDescanso === 'ninguno' && (
                      <div className="mt-3 p-3 rounded bg-destructive/10 border border-destructive/30">
                        <p className="text-xs font-medium text-destructive">
                          Trabajar sin descanso viola el Art. 69 LFT
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          El 7mo dia trabajado debe pagarse DOBLE (Art. 73 LFT). Este concepto se agregara a tu calculo.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {horasExtrasCalc.totalSemanal > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm font-medium text-destructive">
                        Horas extra semanales: {horasExtrasCalc.totalSemanal.toFixed(1)} hrs
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1 mt-1">
                        {horasExtrasCalc.horasExtraDiurnas > 0 && (
                          <p>Diurnas (6am-8pm): {horasExtrasCalc.horasExtraDiurnas.toFixed(1)} hrs - pago al doble/triple</p>
                        )}
                        {horasExtrasCalc.horasExtraNocturnas > 0 && (
                          <p>Nocturnas (8pm-6am): {horasExtrasCalc.horasExtraNocturnas.toFixed(1)} hrs - pago al doble/triple + 20%</p>
                        )}
                        {horasExtrasCalc.horasComidaDentro > 0 && comidaDentroTrabajo && (
                          <p>Por comer dentro: {horasExtrasCalc.horasComidaDentro.toFixed(1)} hrs (Art. 63 LFT)</p>
                        )}
                      </div>
                      <div className="text-xs mt-2 p-2 bg-background/50 rounded">
                        <p className="font-medium text-foreground">Segun LFT Art. 60-68:</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                          <li>Jornada diurna: max 8 hrs (6am-8pm)</li>
                          <li>Jornada nocturna: max 7 hrs (8pm-6am)</li>
                          <li>Jornada mixta: max 7.5 hrs (si hay menos de 3.5 hrs nocturnas)</li>
                          <li>Extras nocturnas valen 20% mas que diurnas</li>
                          <li>Primeras 9 hrs extras/sem = doble | Adicionales = triple</li>
                        </ul>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Estas horas extra se integran a tu salario diario para calcular la indemnizacion
                      </p>
                    </div>
                  )}
                  
                  {/* Tiempo con este horario */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-sm font-medium mb-3">Cuanto tiempo has tenido este horario?</p>
                    <OptionChips
                      options={[
                        { value: 'ultimo_mes', label: 'Solo el ultimo mes' },
                        { value: 'siempre', label: 'Siempre he tenido este horario' },
                      ]}
                      value={tiempoConHorario}
                      onChange={(v) => setTiempoConHorario(v as 'ultimo_mes' | 'siempre')}
                    />
                    {tiempoConHorario === 'ultimo_mes' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Solo calcularemos las horas extra del ultimo mes (4 semanas)
                      </p>
                    )}
                    {tiempoConHorario === 'siempre' && fechaIngreso && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Calcularemos las horas extra desde tu fecha de ingreso
                      </p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <MoneySlider
                  value={comisionesPendientes}
                  onChange={setComisionesPendientes}
                  min={0}
                  max={rangoComisionesExtendido ? 500000 : 100000}
                  step={1}
                  label="Comisiones/bonos pendientes"
                />
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50 border -mt-2">
                  <Checkbox
                    id="rangoComisiones"
                    checked={rangoComisionesExtendido}
                    onCheckedChange={(checked) => setRangoComisionesExtendido(checked === true)}
                  />
                  <label htmlFor="rangoComisiones" className="text-xs cursor-pointer">
                    Mas de $100,000 en comisiones
                  </label>
                </div>
                
                <Separator />
                
                <NumberStepper
                  value={domingosTrabajados}
                  onChange={setDomingosTrabajados}
                  min={0}
                  max={52}
                  label="Domingos trabajados sin prima (max 52)"
                  suffix="domingos"
                />
                <p className="text-xs text-muted-foreground -mt-4">
                  Prima dominical = 25% del salario diario por domingo
                </p>
                
                <Separator />
                
                <NumberStepper
                  value={diasFestivosTrabajados}
                  onChange={setDiasFestivosTrabajados}
                  min={0}
                  max={50}
                  label="Días festivos trabajados (sin pago doble)"
                  suffix="días"
                />
                
                <Separator />
                
                <MoneySlider
                  value={diferenciasSalariales}
                  onChange={setDiferenciasSalariales}
                  min={0}
                  max={rangoDiferenciasExtendido ? 500000 : 100000}
                  step={1}
                  label="Diferencias salariales adeudadas"
                />
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50 border -mt-2">
                  <Checkbox
                    id="rangoDiferencias"
                    checked={rangoDiferenciasExtendido}
                    onCheckedChange={(checked) => setRangoDiferenciasExtendido(checked === true)}
                  />
                  <label htmlFor="rangoDiferencias" className="text-xs cursor-pointer">
                    Mas de $100,000 en diferencias
                  </label>
                </div>
              </CardContent>
            </Card>
            
            {/* Resultados juicio */}
            {resultadoJuicio && (
              <Card className="border-destructive">
                <CardHeader className="bg-destructive/5">
                  <CardTitle className="text-lg text-destructive">Potencial en juicio</CardTitle>
                  <CardDescription>
                    Duración estimada: {duracionJuicio} meses
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {resultadoJuicio.salariosCaidosMonto > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <div>
                        <span>Salarios caidos</span>
                        <span className="text-xs text-destructive ml-2 font-mono">Art. 48 LFT</span>
                      </div>
                      <span className="font-medium">{formatMXN(resultadoJuicio.salariosCaidosMonto)}</span>
                    </div>
                  )}
                  {resultadoJuicio.horasExtraMonto > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <div>
                        <span>Horas extra</span>
                        <span className="text-xs text-destructive ml-2 font-mono">Art. 66-68 LFT</span>
                      </div>
                      <span className="font-medium">{formatMXN(resultadoJuicio.horasExtraMonto)}</span>
                    </div>
                  )}
                  {resultadoJuicio.comisionesMonto > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <div>
                        <span>Comisiones/bonos</span>
                        <span className="text-xs text-destructive ml-2 font-mono">Art. 84-85 LFT</span>
                      </div>
                      <span className="font-medium">{formatMXN(resultadoJuicio.comisionesMonto)}</span>
                    </div>
                  )}
                  {resultadoJuicio.primaDominicalMonto > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <div>
                        <span>Prima dominical</span>
                        <span className="text-xs text-destructive ml-2 font-mono">Art. 71 LFT</span>
                      </div>
                      <span className="font-medium">{formatMXN(resultadoJuicio.primaDominicalMonto)}</span>
                    </div>
                  )}
                  {resultadoJuicio.diasFestivosMonto > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <div>
                        <span>Dias festivos</span>
                        <span className="text-xs text-destructive ml-2 font-mono">Art. 74-75 LFT</span>
                      </div>
                      <span className="font-medium">{formatMXN(resultadoJuicio.diasFestivosMonto)}</span>
                    </div>
                  )}
                  {resultadoJuicio.diferenciasSalarialesMonto > 0 && (
                    <div className="flex justify-between items-start text-sm">
                      <div>
                        <span>Diferencias salariales</span>
                        <span className="text-xs text-destructive ml-2 font-mono">Art. 82-89 LFT</span>
                      </div>
                      <span className="font-medium">{formatMXN(resultadoJuicio.diferenciasSalarialesMonto)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm">
                    <span>Extras del juicio</span>
                    <span className="font-medium">{formatMXN(resultadoJuicio.totalExtras)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total potencial (liquidacion + extras)</span>
                    <span>{formatMXN(resultadoJuicio.totalPotencial)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Honorarios Abogado laboralista al ganar juicio (35%)</span>
                    <span>{formatMXN(resultadoJuicio.totalPotencial * 0.35)}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold text-destructive pt-2 border-t">
                    <span>Neto potencial para ti</span>
                    <span>{formatMXN(resultadoJuicio.totalPotencial * 0.65)}</span>
                  </div>
                  
                  {/* Comparativo con Conciliación */}
                  {resultadoLiquidacion && (
                    <>
                      <Separator className="my-4" />
                      
                      {/* Resumen Conciliación en azul */}
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm font-medium text-primary mb-2">Si concilias en el Centro de Conciliacion:</p>
                        <div className="flex justify-between text-sm">
                          <span>Total bruto conciliacion</span>
                          <span className="font-medium">{formatMXN(resultadoLiquidacion.totalBruto)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Honorarios abogado (25%)</span>
                          <span>{formatMXN(resultadoLiquidacion.totalBruto * 0.25)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-primary mt-1">
                          <span>Neto conciliacion</span>
                          <span>{formatMXN(resultadoLiquidacion.totalBruto * 0.75)}</span>
                        </div>
                      </div>
                      
                      {/* Diferencia y porcentaje */}
                      {(() => {
                        const netoConciliacion = resultadoLiquidacion.totalBruto * 0.75
                        const netoJuicio = resultadoJuicio.totalPotencial * 0.65
                        const diferencia = netoJuicio - netoConciliacion
                        const porcentajeAumento = netoConciliacion > 0 
                          ? ((diferencia / netoConciliacion) * 100).toFixed(0) 
                          : 0
                        
                        return diferencia > 0 ? (
                          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-destructive/10 border border-primary/30 mt-3">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Diferencia potencial al ir a juicio</p>
                              <p className="text-2xl font-bold text-foreground">
                                +{formatMXN(diferencia)}
                              </p>
                              <p className="text-sm font-medium text-destructive mt-1">
                                +{porcentajeAumento}% mas que conciliando
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                *El juicio toma aproximadamente {duracionJuicio} meses
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mt-3">
                            <div className="text-center">
                              <p className="text-sm font-medium text-primary">
                                En tu caso, conciliar puede ser la mejor opcion
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Recibes un monto similar en menos tiempo
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                    </>
                  )}
                </CardContent>
                
                {/* Botón para ir a Resumen */}
                <div className="p-4 pt-0">
                  <Button 
                    className="w-full h-14 text-lg font-semibold gap-2"
                    onClick={() => {
                      setTabActiva('resumen')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <FileText className="w-5 h-5" />
                    Ver Resumen
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
          
{/* Tab Resumen - Solo si no es modo basico */}
              {!modoBasico && (
              <TabsContent value="resumen" className="space-y-6">
                {resultadoLiquidacion ? (
                  <>
                {/* Resumen comparativo: Conciliación vs Juicio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comparativa de opciones</CardTitle>
                    <CardDescription>Elige la mejor via para tu caso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Opción 1: Conciliación Pre-judicial */}
                      <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" className="text-xs">Recomendado</Badge>
                        </div>
                        <h3 className="font-bold text-primary mb-1">Conciliacion Pre-judicial</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          Centro de Conciliacion Laboral (local o federal)
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total bruto</span>
                            <span className="font-medium">{formatMXN(resultadoLiquidacion.totalBruto)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Honorarios (25%)</span>
                            <span>-{formatMXN(resultadoLiquidacion.totalBruto * 0.25)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-primary">
                            <span>NETO PARA TI</span>
                            <span className="text-xl">{formatMXN(resultadoLiquidacion.totalBruto * 0.75)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Tiempo estimado: 1-3 meses | Sin juicio
                        </p>
                      </div>
                      
                      {/* Opción 2: Juicio en Tribunales */}
                      {resultadoJuicio && (
                        <div className="p-4 rounded-lg bg-destructive/5 border-2 border-destructive/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive" className="text-xs">Mayor potencial</Badge>
                          </div>
                          <h3 className="font-bold text-destructive mb-1">Juicio Laboral</h3>
                          <p className="text-xs text-muted-foreground mb-3">
                            Tribunales Laborales (estatales o federales)
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Total potencial bruto</span>
                              <span className="font-medium">{formatMXN(resultadoJuicio.totalPotencial)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Honorarios (35%)</span>
                              <span>-{formatMXN(resultadoJuicio.totalPotencial * 0.35)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-destructive">
                              <span>NETO POTENCIAL</span>
                              <span className="text-xl">{formatMXN(resultadoJuicio.totalPotencial * 0.65)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            Tiempo estimado: 6-24 meses | Requiere abogado
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs bg-muted/50 p-3 rounded space-y-1">
                      <p><strong>Conciliacion:</strong> Se resuelve en el Centro de Conciliacion sin necesidad de juicio. Comision del abogado 25%.</p>
                      <p><strong>Juicio:</strong> Si no hay acuerdo, se demanda en Tribunales Laborales. Comision del abogado 35% por la complejidad.</p>
                      <p className="text-primary font-medium mt-2">Solo pagas si recuperas tu dinero.</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Desglose Liquidación Básica con Artículos LFT */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Desglose: Liquidacion (Conciliacion)</CardTitle>
                    <CardDescription>Conceptos reclamables en Centro de Conciliacion | Comision 25%</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {resultadoLiquidacion.indemnizacionConstitucional > 0 && (
                      <div className="flex justify-between items-start p-3 rounded bg-muted/30 border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Indemnizacion constitucional (3 meses)</p>
                          <p className="text-xs text-primary font-mono">Art. 48 y 50 LFT</p>
                        </div>
                        <p className="font-semibold text-sm">{formatMXN(resultadoLiquidacion.indemnizacionConstitucional)}</p>
                      </div>
                    )}
                    
                    {resultadoLiquidacion.indemnizacionAntiguedad > 0 && (
                      <div className="flex justify-between items-start p-3 rounded bg-muted/30 border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">20 dias por año (antiguedad)</p>
                          <p className="text-xs text-primary font-mono">Art. 50 Fraccion II LFT</p>
                        </div>
                        <p className="font-semibold text-sm">{formatMXN(resultadoLiquidacion.indemnizacionAntiguedad)}</p>
                      </div>
                    )}
                    
                    {resultadoLiquidacion.primaAntiguedad > 0 && (
                      <div className="flex justify-between items-start p-3 rounded bg-muted/30 border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Prima de antiguedad (12 dias/año)</p>
                          <p className="text-xs text-primary font-mono">Art. 162 LFT</p>
                        </div>
                        <p className="font-semibold text-sm">{formatMXN(resultadoLiquidacion.primaAntiguedad)}</p>
                      </div>
                    )}
                    
                    {(resultadoLiquidacion.vacacionesPendientes > 0 || resultadoLiquidacion.vacacionesProporcionales > 0) && (
                      <div className="flex justify-between items-start p-3 rounded bg-muted/30 border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Vacaciones (pendientes + proporcionales)</p>
                          <p className="text-xs text-primary font-mono">Art. 76 y 79 LFT</p>
                          <p className="text-xs text-muted-foreground">
                            {resultadoLiquidacion.diasVacacionesProporcionales?.toFixed(1) || 0} días proporcionales
                          </p>
                        </div>
                        <p className="font-semibold text-sm">{formatMXN((resultadoLiquidacion.vacacionesPendientes || 0) + (resultadoLiquidacion.vacacionesProporcionales || 0))}</p>
                      </div>
                    )}
                    
                    {resultadoLiquidacion.primaVacacional > 0 && (
                      <div className="flex justify-between items-start p-3 rounded bg-muted/30 border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Prima vacacional ({primaVacacionalPct}%)</p>
                          <p className="text-xs text-primary font-mono">Art. 80 LFT</p>
                        </div>
                        <p className="font-semibold text-sm">{formatMXN(resultadoLiquidacion.primaVacacional)}</p>
                      </div>
                    )}
                    
                    {resultadoLiquidacion.aguinaldoProporcional > 0 && (
                      <div className="flex justify-between items-start p-3 rounded bg-muted/30 border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Aguinaldo proporcional</p>
                          <p className="text-xs text-primary font-mono">Art. 87 LFT</p>
                        </div>
                        <p className="font-semibold text-sm">{formatMXN(resultadoLiquidacion.aguinaldoProporcional)}</p>
                      </div>
                    )}
                    
                    {resultadoLiquidacion.salariosAdeudados > 0 && (
                      <div className="flex justify-between items-start p-3 rounded bg-muted/30 border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Salarios adeudados</p>
                          <p className="text-xs text-primary font-mono">Art. 88 LFT</p>
                        </div>
                        <p className="font-semibold text-sm">{formatMXN(resultadoLiquidacion.salariosAdeudados)}</p>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center p-3 rounded bg-muted/50 border">
                      <p className="font-bold">Total bruto</p>
                      <p className="font-bold">{formatMXN(resultadoLiquidacion.totalBruto)}</p>
                    </div>
                    
                    {/* Transparencia en Costos */}
                    <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transparencia en Costos Legales</p>
                      
                      <div className="flex justify-between items-center p-3 rounded bg-blue-50 border border-blue-200">
                        <div>
                          <p className="text-sm font-medium text-blue-800">Conciliación (25%)</p>
                          <p className="text-xs text-blue-600">Arreglo en Centro de Conciliación</p>
                        </div>
                        <p className="text-sm font-semibold text-blue-800">-{formatMXN(resultadoLiquidacion.totalBruto * 0.25)}</p>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded bg-amber-50 border border-amber-200">
                        <div>
                          <p className="text-sm font-medium text-amber-800">Juicio o Sentencia (35%)</p>
                          <p className="text-xs text-amber-600">Procedimiento iniciado en tribunales</p>
                        </div>
                        <p className="text-sm font-semibold text-amber-800">-{formatMXN(resultadoLiquidacion.totalBruto * 0.35)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded bg-primary/20 border border-primary">
                      <p className="font-bold text-primary">NETO (CONCILIACIÓN 25%)</p>
                      <p className="font-bold text-primary text-lg">{formatMXN(resultadoLiquidacion.totalBruto * 0.75)}</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Desglose Juicio Potencial con Artículos LFT */}
                {resultadoJuicio && resultadoJuicio.totalExtras > 0 && (
                  <Card className="border-destructive/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-destructive">Desglose: Juicio en Tribunales</CardTitle>
                      <CardDescription>Conceptos adicionales en Tribunales Laborales (estatales/federales) | Comision 35%</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {resultadoJuicio.salariosCaidosMonto > 0 && (
                        <div className="flex justify-between items-start p-3 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Salarios caidos</p>
                            <p className="text-xs text-destructive font-mono">Art. 48 LFT (max 12 meses + 2% mensual)</p>
                          </div>
                          <p className="font-semibold text-sm">{formatMXN(resultadoJuicio.salariosCaidosMonto)}</p>
                        </div>
                      )}
                      
                      {resultadoJuicio.horasExtraMonto > 0 && (
                        <div className="flex justify-between items-start p-3 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Horas extra no pagadas</p>
                            <p className="text-xs text-destructive font-mono">Art. 66-68 LFT (dobles/triples)</p>
                          </div>
                          <p className="font-semibold text-sm">{formatMXN(resultadoJuicio.horasExtraMonto)}</p>
                        </div>
                      )}
                      
                      {resultadoJuicio.comisionesMonto > 0 && (
                        <div className="flex justify-between items-start p-3 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Comisiones/bonos pendientes</p>
                            <p className="text-xs text-destructive font-mono">Art. 84 y 85 LFT</p>
                          </div>
                          <p className="font-semibold text-sm">{formatMXN(resultadoJuicio.comisionesMonto)}</p>
                        </div>
                      )}
                      
                      {resultadoJuicio.primaDominicalMonto > 0 && (
                        <div className="flex justify-between items-start p-3 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Prima dominical</p>
                            <p className="text-xs text-destructive font-mono">Art. 71 LFT (25% adicional)</p>
                          </div>
                          <p className="font-semibold text-sm">{formatMXN(resultadoJuicio.primaDominicalMonto)}</p>
                        </div>
                      )}
                      
                      {resultadoJuicio.diasFestivosMonto > 0 && (
                        <div className="flex justify-between items-start p-3 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Dias festivos trabajados</p>
                            <p className="text-xs text-destructive font-mono">Art. 74 y 75 LFT (salario doble)</p>
                          </div>
                          <p className="font-semibold text-sm">{formatMXN(resultadoJuicio.diasFestivosMonto)}</p>
                        </div>
                      )}
                      
                      {resultadoJuicio.diferenciasSalarialesMonto > 0 && (
                        <div className="flex justify-between items-start p-3 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Diferencias salariales</p>
                            <p className="text-xs text-destructive font-mono">Art. 82-89 LFT</p>
                          </div>
                          <p className="font-semibold text-sm">{formatMXN(resultadoJuicio.diferenciasSalarialesMonto)}</p>
                        </div>
                      )}
                      
                      {resultadoJuicio.otrosMonto > 0 && (
                        <div className="flex justify-between items-start p-3 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Otros conceptos</p>
                            <p className="text-xs text-destructive font-mono">Segun caso especifico</p>
                          </div>
                          <p className="font-semibold text-sm">{formatMXN(resultadoJuicio.otrosMonto)}</p>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center p-3 rounded bg-destructive/10 border border-destructive/30">
                        <p className="font-bold">Total potencial bruto</p>
                        <p className="font-bold">{formatMXN(resultadoJuicio.totalPotencial)}</p>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Honorarios Abogado laboralista al ganar juicio (35%)</p>
                        <p className="text-sm text-muted-foreground">-{formatMXN(resultadoJuicio.totalPotencial * 0.35)}</p>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded bg-destructive/20 border border-destructive">
                        <p className="font-bold text-destructive">NETO POTENCIAL (JUICIO)</p>
                        <p className="font-bold text-destructive text-lg">{formatMXN(resultadoJuicio.totalPotencial * 0.65)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Botones: Generar Cálculo y Recibir Asesoría Legal */}
                {modoBasico ? (
                  <Card className="border-2 border-blue-300 bg-blue-50">
                    <CardContent className="pt-6 pb-6 text-center">
                      <Vault className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                      <p className="font-medium mb-2 text-blue-900">Crea tu cuenta gratis</p>
                      <p className="text-sm text-blue-700 mb-4">
                        Guarda tus calculos, descarga documentos PDF y recibe asesoria legal personalizada
                      </p>
                      <Link href="/acceso">
                        <Button size="lg" className="w-full gap-2">
                          <Shield className="w-4 h-4" />
                          Crear cuenta gratis
                        </Button>
                      </Link>
                      <p className="text-xs text-blue-600 mt-3">
                        Solo necesitas tu nombre, sin correo ni contrasena
                      </p>
                    </CardContent>
                  </Card>
                ) : !documentosGenerados ? (
                  <Card className="border-2 border-dashed border-primary/50">
                    <CardContent className="pt-6 pb-6 text-center">
                      <FileText className="w-12 h-12 mx-auto text-primary/50 mb-3" />
                      <p className="font-medium mb-2">Siguiente paso</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Genera tu cálculo o solicita asesoría de un abogado laboralista
                      </p>
                      
                      <div className="space-y-3">
                        {/* Botón principal: Generar Cálculo */}
                        <Button 
                          onClick={handleGenerarDocumentos}
                          disabled={generandoDocumentos || !nombreEmpresa.trim()}
                          size="lg"
                          className="w-full gap-2"
                        >
                          {generandoDocumentos ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Generar Cálculo
                            </>
                          )}
                        </Button>
                        
                        {/* Botón secundario: Crear Caso */}
                        <Button 
                          onClick={handleCrearCaso}
                          disabled={creandoCaso || casoCreado || !nombreEmpresa.trim()}
                          size="lg"
                          variant="outline"
                          className="w-full gap-2 border-green-500 text-green-700 hover:bg-green-50 bg-transparent"
                        >
                          {creandoCaso ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creando caso y guardando...
                            </>
                          ) : casoCreado ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Caso creado: {folioDelCaso}
                            </>
                          ) : (
                            <>
                              <Scale className="w-4 h-4" />
                              Crear Caso
                            </>
                          )}
                        </Button>
                        
                        {casoCreado && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
                            <p className="text-green-800 text-sm font-medium">Caso creado y cálculo guardado</p>
                            <p className="text-green-700 text-xs mt-1">
                              Folio: <span className="font-mono font-bold">{folioDelCaso}</span>
                            </p>
                            <p className="text-green-600 text-xs mt-1">
                              Tu cálculo se guardó en tu bóveda de evidencias. Un abogado revisará tu caso pronto.
                            </p>
                          </div>
                        )}
                        
                        {errorCaso && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{errorCaso}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      {!nombreEmpresa.trim() && (
                        <p className="text-xs text-amber-600 mt-3">
                          Ingresa el nombre de la empresa arriba para continuar
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Alerta de límite alcanzado */}
                    {limiteAlcanzado && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Has alcanzado el límite de cálculos guardados. Actualiza tu cuenta para guardar más.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Botón principal: Guardar en Bóveda */}
                    <Button 
                      onClick={handleGuardarEnBoveda}
                      disabled={guardandoBoveda || guardadoExitoso || limiteAlcanzado}
                      size="lg"
                      className="w-full gap-2 h-14"
                    >
                      {guardandoBoveda ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Guardando...
                        </>
                      ) : guardadoExitoso ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Guardado en tu Bóveda
                        </>
                      ) : (
                        <>
                          <Vault className="w-5 h-5" />
                          Guardar Cálculo en la Bóveda
                        </>
                      )}
                    </Button>
                    
                    {/* Contador de cálculos */}
                    <p className="text-xs text-center text-muted-foreground">
                      {calculosGuardados} de {limiteAlcanzado ? calculosGuardados : calculosGuardados < 3 ? 3 : 5} cálculos guardados
                    </p>
                    
                    {/* Documentos generados - Solo visible después de guardar */}
                    {guardadoExitoso && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Tu documento (infografía) */}
                        <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-sm">Tu Liquidación</p>
                              <p className="text-xs text-muted-foreground">Infografía de tu caso</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">Para ti</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                if (pdfLiquidacionUrl) {
                                  setTipoPDFActual('liquidacion')
                                  setPdfBlobUrl(pdfLiquidacionUrl)
                                  setVisorPDFAbierto(true)
                                } else {
                                  handleVisualizarPDF()
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1 bg-transparent"
                            >
                              <Eye className="w-3 h-3" />
                              Ver
                            </Button>
                            <Button 
                              onClick={handleDescargarPDF}
                              disabled={descargandoPDF}
                              size="sm"
                              className="flex-1 gap-1"
                            >
                              {descargandoPDF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                              Descargar
                            </Button>
                          </div>
                        </div>
                        
                        {/* Propuesta para empresa */}
                        <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-sm">Propuesta Empresa</p>
                              <p className="text-xs text-muted-foreground">Para negociación</p>
                            </div>
                            <Badge variant="outline" className="text-xs bg-amber-100">Empresa</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                if (pdfPropuestaUrl) {
                                  setTipoPDFActual('propuesta')
                                  setPdfBlobUrl(pdfPropuestaUrl)
                                  setVisorPDFAbierto(true)
                                } else {
                                  handleVisualizarPropuestaEmpresa()
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1 bg-transparent"
                            >
                              <Eye className="w-3 h-3" />
                              Ver
                            </Button>
                            <Button 
                              onClick={handleDescargarPropuestaEmpresa}
                              variant="secondary"
                              size="sm"
                              className="flex-1 gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Descargar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Mensaje cuando no ha guardado */}
                    {!guardadoExitoso && (
                      <p className="text-xs text-center text-muted-foreground">
                        Guarda tu cálculo para poder ver y descargar los documentos PDF
                      </p>
                    )}
                  </div>
                )}
                
                {/* Disclaimer */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      <strong>Aviso legal:</strong> Esta es una estimación informativa basada en la Ley Federal del Trabajo. 
                      Los montos pueden variar según las condiciones específicas del caso y la jurisdicción. 
                      La asesoría y representación legal la brinda un abogado certificado. 
                      mecorrieron.mx actúa como intermediario tecnológico.
                    </p>
                  </CardContent>
                </Card>
                
                {/* CTA */}
                <Card className="border-primary bg-primary/5">
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold mb-2">¿Necesitas ayuda con tu caso?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Te conectamos con un abogado especialista
                    </p>
                    <AyudaUrgenteButton className="w-full sm:w-auto" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    Completa los datos en la pestaña "Liquidación" para ver tu resumen.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
              )}
        </Tabs>
      </main>
      
      {/* Modal Visor de PDF */}
      <Dialog open={visorPDFAbierto} onOpenChange={handleCerrarVisorPDF}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {tipoPDFActual === 'liquidacion' 
                ? 'Tu Documento de Liquidación' 
                : 'Propuesta para la Empresa'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {tipoPDFActual === 'liquidacion' && (
                <Badge variant="secondary" className="text-xs">Para ti</Badge>
              )}
              {tipoPDFActual === 'propuesta' && (
                <Badge variant="outline" className="text-xs">Para empresa</Badge>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (tipoPDFActual === 'liquidacion') {
                    handleDescargarPDF()
                  } else {
                    handleDescargarPropuestaEmpresa()
                  }
                  handleCerrarVisorPDF()
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCerrarVisorPDF}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 h-full bg-muted">
            {pdfBlobUrl && (
              <iframe
                src={pdfBlobUrl}
                className="w-full h-[calc(90vh-60px)]"
                title={tipoPDFActual === 'liquidacion' ? 'Tu documento de liquidación' : 'Propuesta para empresa'}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal: Ayuda Urgente - Paso 1 */}
      <Dialog open={mostrarAyudaUrgente && pasoAyuda === 1} onOpenChange={(open) => {
        if (!open) {
          setMostrarAyudaUrgente(false)
          setPasoAyuda(1)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              Asesoría Legal Gratuita
            </DialogTitle>
            <DialogDescription>
              Conecta con un abogado laboral certificado para defender tus derechos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-primary/5 border">
              <p className="font-medium mb-2">Tu cálculo estimado:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Conciliación:</span>
                  <p className="font-bold text-primary">{formatMXN(resultadoLiquidacion?.total || 0)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Juicio:</span>
                  <p className="font-bold text-destructive">{formatMXN(resultadoJuicio?.total || 0)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Primera consulta 100% gratuita</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Abogados certificados en derecho laboral</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Respuesta en menos de 24 horas</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMostrarAyudaUrgente(false)} className="flex-1 bg-transparent">
              Después
            </Button>
            <Button onClick={() => setPasoAyuda(2)} className="flex-1 gap-2">
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal: Ayuda Urgente - Paso 2 (WhatsApp) */}
      <Dialog open={mostrarAyudaUrgente && pasoAyuda === 2} onOpenChange={(open) => {
        if (!open) {
          setMostrarAyudaUrgente(false)
          setPasoAyuda(1)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Contactar por WhatsApp
            </DialogTitle>
            <DialogDescription>
              Serás redirigido a WhatsApp para iniciar tu asesoría
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
              <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-green-800 mb-2">
                Un abogado te atenderá personalmente
              </p>
              <p className="text-sm text-green-700">
                Comparte tu caso y recibe orientación profesional sobre los pasos a seguir
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Al continuar, aceptas que compartiremos los datos de tu cálculo con el abogado asignado para brindarte mejor asesoría.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPasoAyuda(1)} className="bg-transparent">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Atrás
            </Button>
            <Button 
              onClick={() => {
                const mensaje = `Hola, necesito asesoría legal laboral.%0A%0AMi cálculo:%0A- Conciliación: ${formatMXN(resultadoLiquidacion?.total || 0)}%0A- Juicio: ${formatMXN(resultadoJuicio?.total || 0)}%0A- Empresa: ${nombreEmpresa || 'No especificada'}%0A- Antigüedad: ${resultadoLiquidacion?.antiguedad?.anios || 0} años`
                window.open(`https://wa.me/5215512345678?text=${mensaje}`, '_blank')
                setMostrarAyudaUrgente(false)
                setPasoAyuda(1)
              }}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      

    </div>
  )
}
