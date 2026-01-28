'use server'

// ===========================================
// REGLAS DE VERIFICACION PARA ABOGADOS
// Sistema de Upgrades y Downgrades
// ===========================================

// Jerarquia de roles para abogados
export const LAWYER_ROLE_HIERARCHY = {
  // Rol inicial al registrarse
  guest: 'guestlawyer',
  // Abogado en proceso de verificacion
  guestlawyer: 'lawyer',
  // Abogado verificado
  lawyer: 'admin',
  // Roles superiores
  admin: 'superadmin',
  superadmin: 'superadmin'
} as const

// Jerarquia inversa para downgrades
export const LAWYER_DOWNGRADE_HIERARCHY = {
  superadmin: 'admin',
  admin: 'lawyer',
  lawyer: 'guestlawyer',
  guestlawyer: 'guest',
  guest: 'guest'
} as const

// ===========================================
// DOCUMENTOS REQUERIDOS POR TIPO DE ABOGADO
// ===========================================

export const DOCUMENTOS_REQUERIDOS_ABOGADO = {
  // Documentos obligatorios para todos
  obligatorios: [
    { key: 'ine_url', nombre: 'INE/Pasaporte', descripcion: 'Identificacion oficial vigente' },
    { key: 'cedula_url', nombre: 'Cedula Profesional', descripcion: 'Cedula emitida por la SEP' },
    { key: 'curp', nombre: 'CURP', descripcion: 'Clave Unica de Registro de Poblacion' }
  ],
  // Documentos opcionales pero recomendados
  opcionales: [
    { key: 'titulo_url', nombre: 'Titulo Universitario', descripcion: 'Titulo de Licenciatura en Derecho' },
    { key: 'constancia_fiscal_url', nombre: 'Constancia de Situacion Fiscal', descripcion: 'RFC actualizado' },
    { key: 'rfc', nombre: 'RFC', descripcion: 'Registro Federal de Contribuyentes' }
  ],
  // Documentos para despachos
  despacho: [
    { key: 'acta_constitutiva_url', nombre: 'Acta Constitutiva', descripcion: 'Documento de constitucion del despacho' },
    { key: 'poder_representante_url', nombre: 'Poder del Representante', descripcion: 'Poder notarial del representante legal' },
    { key: 'rfc_despacho', nombre: 'RFC del Despacho', descripcion: 'RFC de la persona moral' }
  ]
} as const

// ===========================================
// TIPOS DE UPGRADE PARA ABOGADOS
// ===========================================

export type LawyerUpgradeType = 
  | 'registration_complete'      // Registro inicial completado (guest -> guestlawyer)
  | 'documents_submitted'        // Documentos enviados, pendiente revision
  | 'verification_approved'      // Verificacion aprobada (guestlawyer -> lawyer)
  | 'firm_verified'              // Despacho verificado
  | 'admin_promotion'            // Promocion a admin
  | 'reactivation'               // Reactivacion despues de downgrade

// ===========================================
// TIPOS DE DOWNGRADE PARA ABOGADOS
// ===========================================

export type LawyerDowngradeType = 
  | 'documents_missing'          // Documentos faltantes o eliminados
  | 'documents_expired'          // Documentos vencidos (cedula, INE)
  | 'verification_rejected'      // Verificacion rechazada
  | 'inactivity'                 // Inactividad prolongada (>1 año)
  | 'complaint_verified'         // Queja verificada de un cliente
  | 'admin_decision'             // Decision administrativa

// ===========================================
// CRITERIOS DE VERIFICACION
// ===========================================

export interface VerificationCriteria {
  // Perfil basico
  perfilCompleto: boolean
  nombreCompleto: boolean
  telefonoVerificado: boolean
  emailVerificado: boolean
  
  // Documentos obligatorios
  ineSubida: boolean
  ineVerificada: boolean
  cedulaSubida: boolean
  cedulaVerificada: boolean
  curpValido: boolean
  
  // Documentos opcionales
  tituloSubido: boolean
  rfcValido: boolean
  constanciaFiscalSubida: boolean
  
  // Para despachos
  esDespacho: boolean
  actaConstitutivaSubida: boolean
  poderRepresentanteSubido: boolean
  
  // Estado de revision
  documentosEnRevision: boolean
  verificadoPorAdmin: boolean
  verificadoPorSuperadmin: boolean
  
  // Motivo de rechazo si aplica
  motivoRechazo?: string
}

// ===========================================
// FUNCION: Evaluar si puede hacer upgrade
// ===========================================

export function evaluarUpgradeAbogado(
  rolActual: string,
  criterios: VerificationCriteria
): { 
  puedeUpgrade: boolean
  nuevoRol: string
  tipoUpgrade: LawyerUpgradeType
  razon: string
  requisitosRestantes: string[]
} {
  const requisitosRestantes: string[] = []
  
  // Guest -> Guestlawyer (completar registro)
  if (rolActual === 'guest') {
    if (!criterios.nombreCompleto) requisitosRestantes.push('Completar nombre completo')
    if (!criterios.telefonoVerificado) requisitosRestantes.push('Verificar telefono')
    if (!criterios.emailVerificado) requisitosRestantes.push('Verificar email')
    
    if (requisitosRestantes.length === 0) {
      return {
        puedeUpgrade: true,
        nuevoRol: 'guestlawyer',
        tipoUpgrade: 'registration_complete',
        razon: 'Registro de abogado completado. Ahora debes subir tus documentos.',
        requisitosRestantes: []
      }
    }
  }
  
  // Guestlawyer -> Lawyer (verificacion completa)
  if (rolActual === 'guestlawyer') {
    // Requisitos obligatorios
    if (!criterios.ineSubida) requisitosRestantes.push('Subir INE o Pasaporte')
    if (!criterios.cedulaSubida) requisitosRestantes.push('Subir Cedula Profesional')
    if (!criterios.curpValido) requisitosRestantes.push('Ingresar CURP valido')
    if (!criterios.perfilCompleto) requisitosRestantes.push('Completar perfil profesional')
    
    // Si es despacho, requisitos adicionales
    if (criterios.esDespacho) {
      if (!criterios.actaConstitutivaSubida) requisitosRestantes.push('Subir Acta Constitutiva')
      if (!criterios.poderRepresentanteSubido) requisitosRestantes.push('Subir Poder del Representante')
    }
    
    // Si ya envio documentos, esperar revision
    if (requisitosRestantes.length === 0 && !criterios.verificadoPorSuperadmin) {
      if (!criterios.documentosEnRevision) {
        return {
          puedeUpgrade: false,
          nuevoRol: 'guestlawyer',
          tipoUpgrade: 'documents_submitted',
          razon: 'Documentos listos para enviar a revision.',
          requisitosRestantes: ['Enviar documentos a revision']
        }
      }
      return {
        puedeUpgrade: false,
        nuevoRol: 'guestlawyer',
        tipoUpgrade: 'documents_submitted',
        razon: 'Documentos en revision. Un administrador verificara tu informacion.',
        requisitosRestantes: ['Esperando verificacion de administrador']
      }
    }
    
    // Si fue verificado por superadmin
    if (requisitosRestantes.length === 0 && criterios.verificadoPorSuperadmin) {
      return {
        puedeUpgrade: true,
        nuevoRol: 'lawyer',
        tipoUpgrade: 'verification_approved',
        razon: 'Verificacion aprobada. Bienvenido al directorio de abogados verificados.',
        requisitosRestantes: []
      }
    }
  }
  
  return {
    puedeUpgrade: false,
    nuevoRol: rolActual,
    tipoUpgrade: 'registration_complete',
    razon: 'Completa los requisitos pendientes para avanzar.',
    requisitosRestantes
  }
}

// ===========================================
// FUNCION: Evaluar si necesita downgrade
// ===========================================

export function evaluarDowngradeAbogado(
  rolActual: string,
  criterios: Partial<VerificationCriteria>,
  motivoEspecifico?: LawyerDowngradeType
): {
  necesitaDowngrade: boolean
  nuevoRol: string
  tipoDowngrade: LawyerDowngradeType
  razon: string
} {
  // Si hay un motivo especifico forzado
  if (motivoEspecifico) {
    const nuevoRol = LAWYER_DOWNGRADE_HIERARCHY[rolActual as keyof typeof LAWYER_DOWNGRADE_HIERARCHY] || 'guest'
    
    const razones: Record<LawyerDowngradeType, string> = {
      documents_missing: 'Documentos de verificacion eliminados o no encontrados.',
      documents_expired: 'Documentos de verificacion vencidos. Favor de actualizar.',
      verification_rejected: 'Verificacion rechazada por el administrador.',
      inactivity: 'Cuenta inactiva por mas de 1 año.',
      complaint_verified: 'Queja verificada por parte de un cliente.',
      admin_decision: 'Decision administrativa. Contacta soporte para mas informacion.'
    }
    
    return {
      necesitaDowngrade: true,
      nuevoRol,
      tipoDowngrade: motivoEspecifico,
      razon: razones[motivoEspecifico]
    }
  }
  
  // Solo verificar downgrades para roles de abogado verificado
  if (rolActual !== 'lawyer' && rolActual !== 'admin') {
    return {
      necesitaDowngrade: false,
      nuevoRol: rolActual,
      tipoDowngrade: 'documents_missing',
      razon: ''
    }
  }
  
  // Verificar documentos obligatorios
  if (criterios.ineSubida === false || criterios.cedulaSubida === false) {
    return {
      necesitaDowngrade: true,
      nuevoRol: 'guestlawyer',
      tipoDowngrade: 'documents_missing',
      razon: 'Documentos de verificacion faltantes. Tu cuenta ha sido degradada hasta que subas nuevamente los documentos requeridos.'
    }
  }
  
  return {
    necesitaDowngrade: false,
    nuevoRol: rolActual,
    tipoDowngrade: 'documents_missing',
    razon: ''
  }
}

// ===========================================
// LIMITES DE CUENTA POR ROL
// ===========================================

export const LIMITES_CUENTA = {
  guest: {
    maxCasos: 1,
    maxCalculos: 3,
    maxDocumentos: 5,
    puedeCrearCasos: true,
    puedeVerMarketplace: false,
    puedeTomarCasos: false
  },
  guestworker: {
    maxCasos: 2,
    maxCalculos: 5,
    maxDocumentos: 10,
    puedeCrearCasos: true,
    puedeVerMarketplace: false,
    puedeTomarCasos: false
  },
  worker: {
    maxCasos: 10,
    maxCalculos: 50,
    maxDocumentos: 100,
    puedeCrearCasos: true,
    puedeVerMarketplace: false,
    puedeTomarCasos: false
  },
  guestlawyer: {
    maxCasos: 1,           // Solo 1 caso como guestlawyer
    maxCalculos: 3,        // Solo 3 calculos como guestlawyer
    maxDocumentos: 20,
    puedeCrearCasos: true,
    puedeVerMarketplace: true,  // Puede ver pero no tomar
    puedeTomarCasos: false      // No puede tomar casos del marketplace
  },
  lawyer: {
    maxCasos: -1,          // Ilimitado
    maxCalculos: -1,       // Ilimitado
    maxDocumentos: -1,     // Ilimitado
    puedeCrearCasos: true,
    puedeVerMarketplace: true,
    puedeTomarCasos: true
  },
  admin: {
    maxCasos: -1,
    maxCalculos: -1,
    maxDocumentos: -1,
    puedeCrearCasos: true,
    puedeVerMarketplace: true,
    puedeTomarCasos: true
  },
  superadmin: {
    maxCasos: -1,
    maxCalculos: -1,
    maxDocumentos: -1,
    puedeCrearCasos: true,
    puedeVerMarketplace: true,
    puedeTomarCasos: true
  }
} as const

export type RolConLimites = keyof typeof LIMITES_CUENTA

// Funcion para verificar si puede crear un caso
export function puedeCrearCaso(
  rol: string, 
  casosActuales: number
): { permitido: boolean; razon?: string; limitesAlcanzados?: boolean } {
  const limites = LIMITES_CUENTA[rol as RolConLimites]
  
  if (!limites) {
    return { permitido: false, razon: 'Rol no reconocido' }
  }
  
  if (!limites.puedeCrearCasos) {
    return { permitido: false, razon: 'Tu tipo de cuenta no permite crear casos' }
  }
  
  // -1 significa ilimitado
  if (limites.maxCasos === -1) {
    return { permitido: true }
  }
  
  if (casosActuales >= limites.maxCasos) {
    const mensaje = rol === 'guestlawyer' 
      ? `Has alcanzado el limite de ${limites.maxCasos} caso como abogado en verificacion. Verifica tu cuenta para crear casos ilimitados.`
      : `Has alcanzado el limite de ${limites.maxCasos} casos para tu tipo de cuenta.`
    
    return { 
      permitido: false, 
      razon: mensaje,
      limitesAlcanzados: true
    }
  }
  
  return { permitido: true }
}

// Funcion para verificar si puede crear un calculo
export function puedeCrearCalculo(
  rol: string, 
  calculosActuales: number
): { permitido: boolean; razon?: string; limitesAlcanzados?: boolean } {
  const limites = LIMITES_CUENTA[rol as RolConLimites]
  
  if (!limites) {
    return { permitido: false, razon: 'Rol no reconocido' }
  }
  
  // -1 significa ilimitado
  if (limites.maxCalculos === -1) {
    return { permitido: true }
  }
  
  if (calculosActuales >= limites.maxCalculos) {
    const mensaje = rol === 'guestlawyer'
      ? `Has alcanzado el limite de ${limites.maxCalculos} calculos como abogado en verificacion. Verifica tu cuenta para calculos ilimitados.`
      : `Has alcanzado el limite de ${limites.maxCalculos} calculos para tu tipo de cuenta.`
    
    return { 
      permitido: false, 
      razon: mensaje,
      limitesAlcanzados: true
    }
  }
  
  return { permitido: true }
}

// Funcion para obtener uso actual vs limites
export function obtenerUsoCuenta(
  rol: string,
  casosActuales: number,
  calculosActuales: number,
  documentosActuales: number
): {
  casos: { actual: number; limite: number; porcentaje: number; ilimitado: boolean }
  calculos: { actual: number; limite: number; porcentaje: number; ilimitado: boolean }
  documentos: { actual: number; limite: number; porcentaje: number; ilimitado: boolean }
  necesitaUpgrade: boolean
  mensajeUpgrade?: string
} {
  const limites = LIMITES_CUENTA[rol as RolConLimites] || LIMITES_CUENTA.guest
  
  const casos = {
    actual: casosActuales,
    limite: limites.maxCasos,
    porcentaje: limites.maxCasos === -1 ? 0 : Math.min(100, (casosActuales / limites.maxCasos) * 100),
    ilimitado: limites.maxCasos === -1
  }
  
  const calculos = {
    actual: calculosActuales,
    limite: limites.maxCalculos,
    porcentaje: limites.maxCalculos === -1 ? 0 : Math.min(100, (calculosActuales / limites.maxCalculos) * 100),
    ilimitado: limites.maxCalculos === -1
  }
  
  const documentos = {
    actual: documentosActuales,
    limite: limites.maxDocumentos,
    porcentaje: limites.maxDocumentos === -1 ? 0 : Math.min(100, (documentosActuales / limites.maxDocumentos) * 100),
    ilimitado: limites.maxDocumentos === -1
  }
  
  const necesitaUpgrade = casos.porcentaje >= 80 || calculos.porcentaje >= 80 || documentos.porcentaje >= 80
  
  let mensajeUpgrade: string | undefined
  if (rol === 'guestlawyer' && necesitaUpgrade) {
    mensajeUpgrade = 'Estas cerca de alcanzar los limites de tu cuenta. Verifica tu cuenta como abogado para desbloquear acceso ilimitado.'
  }
  
  return { casos, calculos, documentos, necesitaUpgrade, mensajeUpgrade }
}

// ===========================================
// BENEFICIOS POR ROL
// ===========================================

export const BENEFICIOS_POR_ROL = {
  guest: {
    titulo: 'Usuario Invitado',
    beneficios: [
      'Acceso a la calculadora de liquidaciones',
      'Guia de la Ley Federal del Trabajo',
      'Documentos legales basicos'
    ],
    limitaciones: [
      'Sin acceso al marketplace de casos',
      'Sin cedula digital',
      'Sin herramientas AutoCCL'
    ]
  },
  guestlawyer: {
    titulo: 'Abogado en Verificacion',
    beneficios: [
      'Todo lo de usuario invitado',
      'Subir documentos de verificacion',
      'Vista previa de cedula digital',
      'Ver casos en el marketplace (sin tomar)'
    ],
    limitaciones: [
      'Maximo 1 caso propio',
      'Maximo 3 calculos de liquidacion',
      'No puede tomar casos del marketplace',
      'Cedula digital con marca de agua',
      'Sin herramientas AutoCCL completas'
    ]
  },
  lawyer: {
    titulo: 'Abogado Verificado',
    beneficios: [
      'Cedula digital oficial sin marca de agua',
      'Acceso completo al marketplace de casos',
      'Herramientas AutoCCL',
      'Perfil publico en directorio',
      'Firma electronica',
      'Soporte prioritario'
    ],
    limitaciones: []
  },
  admin: {
    titulo: 'Administrador',
    beneficios: [
      'Todo lo de abogado verificado',
      'Verificar otros abogados',
      'Verificar trabajadores',
      'Panel de administracion'
    ],
    limitaciones: []
  }
} as const

// ===========================================
// MENSAJES DE CELEBRACION
// ===========================================

export const MENSAJES_CELEBRACION_ABOGADO = {
  registration_complete: {
    titulo: 'Registro Completado',
    mensaje: 'Has completado tu registro como abogado. Ahora sube tus documentos para verificar tu cuenta.',
    icono: 'user-check',
    color: 'blue'
  },
  documents_submitted: {
    titulo: 'Documentos Enviados',
    mensaje: 'Tus documentos han sido enviados para revision. Te notificaremos cuando sean aprobados.',
    icono: 'file-check',
    color: 'amber'
  },
  verification_approved: {
    titulo: 'Felicidades Licenciado',
    mensaje: 'Tu cuenta ha sido verificada exitosamente. Ya tienes acceso completo a todas las herramientas.',
    icono: 'award',
    color: 'emerald'
  },
  firm_verified: {
    titulo: 'Despacho Verificado',
    mensaje: 'Tu despacho ha sido verificado. Tu equipo puede comenzar a trabajar en la plataforma.',
    icono: 'building',
    color: 'purple'
  },
  reactivation: {
    titulo: 'Cuenta Reactivada',
    mensaje: 'Tu cuenta ha sido reactivada. Ya puedes continuar usando todas las herramientas.',
    icono: 'refresh',
    color: 'green'
  }
} as const
