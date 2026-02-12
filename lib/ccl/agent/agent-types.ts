/**
 * Tipos e interfaces para el Agente de IA CCL
 * Sistema de automatización de solicitudes de conciliación laboral
 */

// Estados del job del agente
export type AgentJobStatus = 
  | 'pending'      // En cola, esperando iniciar
  | 'running'      // Ejecutándose actualmente
  | 'completed'    // Completado exitosamente
  | 'failed'       // Falló con error
  | 'cancelled'    // Cancelado por el usuario

// Pasos del proceso de solicitud
export type AgentStep = 
  | 'initializing'           // Iniciando agente
  | 'gathering_data'         // Recopilando datos del caso
  | 'analyzing_jurisdiction' // Analizando jurisdicción con IA
  | 'starting_browser'       // Iniciando navegador en la nube
  | 'navigating_portal'      // Navegando al portal CCL
  | 'filling_industry'       // Paso 1: Industria o servicio
  | 'filling_request_data'   // Paso 2: Datos de la solicitud
  | 'filling_applicant'      // Paso 3: Datos del solicitante
  | 'filling_respondent'     // Paso 4: Datos del citado
  | 'filling_facts'          // Paso 5: Descripción de hechos
  | 'selecting_modality'     // Paso 6: Tipo de atención
  | 'solving_captcha'        // Resolviendo CAPTCHA
  | 'submitting_form'        // Enviando formulario
  | 'extracting_pdf'         // Extrayendo PDF de acuse
  | 'saving_results'         // Guardando resultados
  | 'notifying'              // Notificando al abogado
  | 'completed'              // Proceso completado
  | 'failed'                 // Proceso fallido

// Tipo de persona (citado/demandado)
export type TipoPersona = 'fisica' | 'moral'

// Modalidad de conciliación
export type ModalidadConciliacion = 'presencial' | 'remota'

// Tipo de terminación laboral
export type TipoTerminacion = 'despido' | 'rescision' | 'renuncia_forzada'

// Datos del trabajador para el formulario
export interface DatosTrabajador {
  nombre: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  curp?: string
  rfc?: string
  fechaNacimiento?: string
  sexo?: 'masculino' | 'femenino'
  telefono?: string
  email?: string
  calle?: string
  numeroExterior?: string
  numeroInterior?: string
  colonia?: string
  codigoPostal?: string
  municipio?: string
  estado?: string
  // Datos laborales
  salarioDiario?: number
  salarioIntegrado?: number
  fechaIngreso?: string
  fechaTerminacion?: string
  puestoTrabajo?: string
  tipoJornada?: string
  diasTrabajados?: number
}

// Datos del citado/empleador para el formulario
export interface DatosCitado {
  tipoPersona: TipoPersona
  // Para persona moral
  razonSocial?: string
  rfc?: string
  representanteLegal?: string
  // Para persona física
  nombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  curp?: string
  // Dirección (común)
  calle?: string
  numeroExterior?: string
  numeroInterior?: string
  colonia?: string
  codigoPostal?: string
  municipio?: string
  estado?: string
  telefono?: string
  email?: string
}

// Datos completos para generar la solicitud
export interface DatosSolicitudAgente {
  casoId: string
  abogadoId: string
  // Datos principales
  trabajador: DatosTrabajador
  citado: DatosCitado
  // Detalles del caso
  tipoTerminacion: TipoTerminacion
  modalidadConciliacion: ModalidadConciliacion
  descripcionHechos?: string
  prestacionesReclamadas?: string[]
  montoEstimado?: number
  // Jurisdicción
  estadoJurisdiccion: string
  esCompetenciaFederal?: boolean
  // Documentos
  ineUrl?: string
  curpUrl?: string
  comprobanteDomicilioUrl?: string
}

// Entrada de log del agente
export interface AgentLogEntry {
  timestamp: string
  step: AgentStep
  message: string
  level: 'info' | 'warning' | 'error' | 'success'
  details?: Record<string, unknown>
  screenshotUrl?: string
}

// Job del agente
export interface AgentJob {
  id: string
  casoId: string
  abogadoId: string
  status: AgentJobStatus
  currentStep: AgentStep
  progress: number // 0-100
  logs: AgentLogEntry[]
  resultado?: AgentResultado
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

// Resultado del agente
export interface AgentResultado {
  success: boolean
  // Datos de la solicitud generada
  folioSolicitud?: string
  fechaLimiteConfirmacion?: string
  modalidad?: ModalidadConciliacion
  // Para conciliación remota
  telefonoConfirmacion?: string
  instruccionesRemota?: string[]
  // Para conciliación presencial
  direccionCcl?: string
  horarioAtencion?: string
  instruccionesPresencial?: string[]
  // PDF del acuse
  pdfAcuseUrl?: string
  pdfAcuseContenido?: string // Texto extraído del PDF
  // Liga única (para audiencias remotas)
  ligaUnicaAudiencia?: string
  // Información adicional
  sedeCcl?: string
  estadoCcl?: string
  reglamentoUrl?: string
  // Error si falló
  error?: string
  errorStep?: AgentStep
}

// Resultado de la solicitud CCL extraído del portal
export interface SolicitudResultado {
  success: boolean
  folioSolicitud?: string
  fechaCita?: string
  horaCita?: string
  modalidad?: ModalidadConciliacion
  ligaUnica?: string
  fechaLimiteConfirmacion?: string
  sedeCcl?: string
  direccionSede?: string
  telefonoConfirmacion?: string
  instrucciones?: string[]
  pdfUrl?: string
}

// Configuración del browser
export interface BrowserConfig {
  headless: boolean
  timeout: number
  viewport: { width: number; height: number }
  userAgent?: string
  proxyUrl?: string
}

// Respuesta del servicio de browser
export interface BrowserSession {
  sessionId: string
  wsEndpoint: string
  status: 'active' | 'closed' | 'error'
}

// Solicitud de resolución de CAPTCHA
export interface CaptchaSolveRequest {
  imageBase64: string
  type: 'text' | 'image_select' | 'recaptcha' | 'hcaptcha'
  instructions?: string
}

// Respuesta del resolutor de CAPTCHA
export interface CaptchaSolveResponse {
  success: boolean
  solution?: string
  confidence?: number
  error?: string
}

// Análisis de jurisdicción
export interface JurisdictionAnalysis {
  estadoRecomendado: string
  esCompetenciaFederal: boolean
  razonamiento: string
  cclRecomendado: {
    nombre: string
    direccion: string
    telefono?: string
    urlPortal: string
  }
  alternativas?: Array<{
    estado: string
    razon: string
  }>
}

// Progreso del formulario
export interface FormProgress {
  currentStep: number
  totalSteps: number
  stepName: string
  fieldsCompleted: number
  fieldsTotal: number
}

// Configuración del agente
export interface AgentConfig {
  maxRetries: number
  retryDelayMs: number
  stepDelayMs: number // Delay entre pasos para simular humano
  screenshotOnError: boolean
  screenshotOnStep: boolean
  timeoutMs: number
  browserConfig: BrowserConfig
}

// Configuración por defecto
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxRetries: 3,
  retryDelayMs: 2000,
  stepDelayMs: 1500, // 1.5 segundos entre acciones
  screenshotOnError: true,
  screenshotOnStep: false,
  timeoutMs: 300000, // 5 minutos máximo
  browserConfig: {
    headless: true,
    timeout: 30000,
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}

// Mapeo de pasos a porcentaje de progreso
export const STEP_PROGRESS: Record<AgentStep, number> = {
  'initializing': 0,
  'gathering_data': 5,
  'analyzing_jurisdiction': 10,
  'starting_browser': 15,
  'navigating_portal': 20,
  'filling_industry': 30,
  'filling_request_data': 40,
  'filling_applicant': 50,
  'filling_respondent': 60,
  'filling_facts': 70,
  'selecting_modality': 75,
  'solving_captcha': 80,
  'submitting_form': 85,
  'extracting_pdf': 90,
  'saving_results': 95,
  'notifying': 98,
  'completed': 100,
  'failed': 100
}

// Mensajes amigables para cada paso
export const STEP_MESSAGES: Record<AgentStep, string> = {
  'initializing': 'Iniciando agente de automatización...',
  'gathering_data': 'Recopilando datos del caso y documentos...',
  'analyzing_jurisdiction': 'Analizando jurisdicción con inteligencia artificial...',
  'starting_browser': 'Iniciando navegador seguro en la nube...',
  'navigating_portal': 'Navegando al portal del Centro de Conciliación...',
  'filling_industry': 'Completando información de industria o servicio...',
  'filling_request_data': 'Llenando datos de la solicitud...',
  'filling_applicant': 'Registrando datos del trabajador...',
  'filling_respondent': 'Registrando datos del empleador/citado...',
  'filling_facts': 'Describiendo los hechos del caso...',
  'selecting_modality': 'Seleccionando modalidad de conciliación...',
  'solving_captcha': 'Resolviendo verificación de seguridad...',
  'submitting_form': 'Enviando solicitud al sistema...',
  'extracting_pdf': 'Descargando acuse de solicitud...',
  'saving_results': 'Guardando resultados en el sistema...',
  'notifying': 'Enviando notificación al abogado...',
  'completed': 'Proceso completado exitosamente',
  'failed': 'El proceso ha fallado'
}
