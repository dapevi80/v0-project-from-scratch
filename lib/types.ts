// Roles de usuario en mecorrieron.mx
export type UserRole = 'guest' | 'worker' | 'guestlawyer' | 'lawyer' | 'admin' | 'superadmin' | 'agent' | 'webagent'

// Perfil de usuario
export interface Profile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  display_name: string // invitado + codigo aleatorio de 8 chars
  phone: string | null
  avatar_url: string | null
  is_anonymous: boolean // true = muestra display_name, false = muestra full_name
  referral_code: string // mismo codigo de 8 chars, unico
  created_at: string
  updated_at: string
}

// Generar codigo aleatorio de 8 caracteres alfanumericos
export function generateRandomCode(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generar nombre de invitado
export function generateGuestName(): string {
  return `invitado${generateRandomCode(8)}`
}

// Usuario con perfil
export interface UserWithProfile {
  id: string
  email: string
  profile: Profile
}

// Tipo de persona (física o moral) para el demandado/citado
export type TipoPersona = 'fisica' | 'moral'

// Modalidad de conciliación (presencial o remota)
export type ModalidadConciliacion = 'presencial' | 'remota'

// Estados del caso de despido
export type CaseStatus = 
  | 'draft'           // Borrador - recopilando información
  | 'evidence'        // Recopilando evidencia
  | 'review'          // En revisión por abogado
  | 'conciliation'    // En conciliación prejudicial
  | 'litigation'      // En litigio
  | 'resolved'        // Resuelto
  | 'closed'          // Cerrado

// Estados del proceso de conciliación (Art. 684-A LFT)
export type ConciliationStatus =
  | 'pending'         // Pendiente de solicitud
  | 'requested'       // Solicitud enviada al Centro
  | 'scheduled'       // Audiencia programada
  | 'in_progress'     // En audiencia
  | 'agreement'       // Convenio alcanzado
  | 'no_agreement'    // Sin acuerdo - constancia emitida
  | 'expired'         // Plazo vencido (45 días)

// Tipo de terminación laboral
export type TerminationType =
  | 'unjustified_dismissal'    // Despido injustificado
  | 'justified_dismissal'      // Despido justificado (Art. 47)
  | 'resignation'              // Renuncia voluntaria
  | 'mutual_agreement'         // Mutuo acuerdo
  | 'employer_fault'           // Rescisión por culpa del patrón (Art. 51)

// Caso de despido
export interface DismissalCase {
  id: string
  worker_id: string
  lawyer_id: string | null
  status: CaseStatus
  conciliation_status: ConciliationStatus
  termination_type: TerminationType
  
  // Datos laborales
  company_name: string
  job_title: string
  start_date: string
  end_date: string
  daily_salary: number
  integrated_salary: number
  
  // Cálculos
  severance_amount: number | null
  settlement_amount: number | null
  
  // Fechas importantes
  dismissal_date: string
  prescription_deadline: string // 2 meses desde despido
  conciliation_deadline: string | null // 45 días desde solicitud
  
  created_at: string
  updated_at: string
}

// Evidencia
export interface Evidence {
  id: string
  case_id: string
  type: 'document' | 'image' | 'audio' | 'video' | 'message'
  title: string
  description: string | null
  file_url: string
  metadata: Record<string, unknown>
  created_at: string
}

// Mensaje en chat
export interface Message {
  id: string
  case_id: string
  sender_id: string
  sender_role: UserRole
  content: string
  attachments: string[]
  read_at: string | null
  created_at: string
}

// Evento de calendario
export interface CalendarEvent {
  id: string
  case_id: string
  title: string
  description: string | null
  event_type: 'conciliation_hearing' | 'deadline' | 'meeting' | 'court_date'
  start_date: string
  end_date: string | null
  location: string | null
  is_mandatory: boolean
  created_at: string
}

// Código de referido
export interface ReferralCode {
  id: string
  code: string
  owner_id: string
  uses_count: number
  max_uses: number | null
  expires_at: string | null
  created_at: string
}

// Usuarios de prueba - todos con la misma contraseña para desarrollo
export const TEST_PASSWORD = 'Cancun2026'

// Usuarios de prueba para desarrollo
// Usuarios verificados (lawyer, admin, superadmin) tienen auto-logout por inactividad
export const TEST_USERS = [
  { email: 'guest123@mecorrieron.mx', password: TEST_PASSWORD, role: 'guest' as UserRole, full_name: 'Usuario Invitado', label: 'guest' },
  { email: 'trabajador123@mecorrieron.mx', password: TEST_PASSWORD, role: 'worker' as UserRole, full_name: 'Juan Perez', label: 'worker' },
  { email: 'guestabogado123@mecorrieron.mx', password: TEST_PASSWORD, role: 'guestlawyer' as UserRole, full_name: 'Lic. Carlos Mendez', label: 'guestlawyer' },
  { email: 'abogado123@mecorrieron.mx', password: TEST_PASSWORD, role: 'lawyer' as UserRole, full_name: 'Lic. Maria Garcia', label: 'lawyer' },
  { email: 'admin123@mecorrieron.mx', password: TEST_PASSWORD, role: 'admin' as UserRole, full_name: 'Admin Sistema', label: 'admin' },
  { email: 'superadmin123@mecorrieron.mx', password: TEST_PASSWORD, role: 'superadmin' as UserRole, full_name: 'Super Admin', label: 'superadmin' },
] as const

// Roles que requieren auto-logout por inactividad (usuarios verificados)
export const ROLES_WITH_AUTO_LOGOUT: UserRole[] = ['lawyer', 'admin', 'superadmin']

// Tiempo de inactividad para auto-logout (en milisegundos)
export const INACTIVITY_TIMEOUT = 60 * 1000 // 1 minuto
