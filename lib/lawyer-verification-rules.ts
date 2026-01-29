// ===========================================
// REGLAS DE VERIFICACION PARA ABOGADOS
// Re-exporta desde lawyer-verification-utils.ts
// ===========================================

// Re-exportar todo desde el archivo de utilidades
export {
  // Constantes
  LAWYER_ROLE_HIERARCHY,
  LAWYER_DOWNGRADE_HIERARCHY,
  DOCUMENTOS_REQUERIDOS_ABOGADO,
  LIMITES_CUENTA,
  BENEFICIOS_POR_ROL,
  MENSAJES_CELEBRACION_ABOGADO,
  // Tipos
  type LawyerUpgradeType,
  type LawyerDowngradeType,
  type VerificationCriteria,
  type RolConLimites,
  // Funciones
  evaluarUpgradeAbogado,
  evaluarDowngradeAbogado,
  puedeCrearCaso,
  puedeCrearCalculo,
  obtenerUsoCuenta
} from './lawyer-verification-utils'
