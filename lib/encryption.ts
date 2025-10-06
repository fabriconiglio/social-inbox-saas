/**
 * Sistema de encriptación para credenciales sensibles
 * Usa AES-256-GCM para encriptar/desencriptar datos sensibles
 */

import crypto from "crypto"
import { z } from "zod"

// Configuración de encriptación
const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32 // 256 bits

// Esquema para validar datos encriptados
const EncryptedDataSchema = z.object({
  encrypted: z.string(),
  iv: z.string(),
  tag: z.string(),
  salt: z.string(),
  algorithm: z.literal(ALGORITHM),
  version: z.string().default("1.0")
})

export type EncryptedData = z.infer<typeof EncryptedDataSchema>

// Resultado de operaciones de encriptación
export interface EncryptionResult {
  success: boolean
  data?: EncryptedData
  error?: string
}

export interface DecryptionResult {
  success: boolean
  data?: string
  error?: string
}

/**
 * Genera una clave de encriptación desde una contraseña y salt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Obtiene la clave maestra de encriptación desde variables de entorno
 */
function getMasterKey(): string {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  
  if (!masterKey) {
    throw new Error("ENCRYPTION_MASTER_KEY no está configurada en las variables de entorno")
  }
  
  if (masterKey.length < 32) {
    throw new Error("ENCRYPTION_MASTER_KEY debe tener al menos 32 caracteres")
  }
  
  return masterKey
}

/**
 * Encripta un texto usando AES-256-GCM
 */
export function encrypt(plaintext: string, masterKey?: string): EncryptionResult {
  try {
    const key = masterKey || getMasterKey()
    
    // Generar salt único para esta encriptación
    const salt = crypto.randomBytes(SALT_LENGTH)
    
    // Derivar clave desde la contraseña maestra y salt
    const derivedKey = deriveKey(key, salt)
    
    // Generar IV único
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Crear cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)
    cipher.setAAD(Buffer.from('channel-credentials', 'utf8'))
    
    // Encriptar
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Obtener tag de autenticación
    const tag = cipher.getAuthTag()
    
    const encryptedData: EncryptedData = {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
      algorithm: ALGORITHM,
      version: "1.0"
    }
    
    console.log("[Encryption] Datos encriptados exitosamente")
    
    return {
      success: true,
      data: encryptedData
    }
    
  } catch (error) {
    console.error("[Encryption] Error encriptando:", error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido en encriptación"
    }
  }
}

/**
 * Desencripta un texto usando AES-256-GCM
 */
export function decrypt(encryptedData: EncryptedData, masterKey?: string): DecryptionResult {
  try {
    const key = masterKey || getMasterKey()
    
    // Validar estructura de datos encriptados
    const validation = EncryptedDataSchema.safeParse(encryptedData)
    if (!validation.success) {
      return {
        success: false,
        error: "Estructura de datos encriptados inválida"
      }
    }
    
    const data = validation.data
    
    // Convertir hex strings a buffers
    const salt = Buffer.from(data.salt, 'hex')
    const iv = Buffer.from(data.iv, 'hex')
    const tag = Buffer.from(data.tag, 'hex')
    
    // Derivar clave desde la contraseña maestra y salt
    const derivedKey = deriveKey(key, salt)
    
    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAAD(Buffer.from('channel-credentials', 'utf8'))
    decipher.setAuthTag(tag)
    
    // Desencriptar
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    console.log("[Encryption] Datos desencriptados exitosamente")
    
    return {
      success: true,
      data: decrypted
    }
    
  } catch (error) {
    console.error("[Encryption] Error desencriptando:", error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido en desencriptación"
    }
  }
}

/**
 * Encripta un objeto JSON
 */
export function encryptObject(obj: Record<string, any>, masterKey?: string): EncryptionResult {
  try {
    const jsonString = JSON.stringify(obj)
    return encrypt(jsonString, masterKey)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error serializando objeto"
    }
  }
}

/**
 * Desencripta un objeto JSON
 */
export function decryptObject<T = Record<string, any>>(
  encryptedData: EncryptedData, 
  masterKey?: string
): DecryptionResult & { parsedData?: T } {
  try {
    const decryptResult = decrypt(encryptedData, masterKey)
    
    if (!decryptResult.success || !decryptResult.data) {
      return {
        success: false,
        error: decryptResult.error || "Error en desencriptación"
      }
    }
    
    const parsedData = JSON.parse(decryptResult.data) as T
    
    return {
      success: true,
      data: decryptResult.data,
      parsedData
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error parseando JSON desencriptado"
    }
  }
}

/**
 * Verifica si una cadena parece estar encriptada
 */
export function isEncrypted(data: any): boolean {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  
  // Verificar si tiene la estructura de datos encriptados
  return (
    typeof data.encrypted === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.tag === 'string' &&
    typeof data.salt === 'string' &&
    data.algorithm === ALGORITHM
  )
}

/**
 * Genera una nueva clave maestra de encriptación
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Valida que una clave maestra sea segura
 */
export function validateMasterKey(key: string): { valid: boolean; error?: string } {
  if (!key) {
    return { valid: false, error: "Clave maestra no puede estar vacía" }
  }
  
  if (key.length < 32) {
    return { valid: false, error: "Clave maestra debe tener al menos 32 caracteres" }
  }
  
  if (key.length > 128) {
    return { valid: false, error: "Clave maestra no puede tener más de 128 caracteres" }
  }
  
  // Verificar que tenga suficiente entropía (caracteres alfanuméricos y símbolos)
  const hasNumbers = /\d/.test(key)
  const hasLetters = /[a-zA-Z]/.test(key)
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(key)
  
  if (!hasNumbers || !hasLetters || !hasSymbols) {
    return { 
      valid: false, 
      error: "Clave maestra debe contener números, letras y símbolos" 
    }
  }
  
  return { valid: true }
}

/**
 * Hash de una clave para logging (sin exponer la clave real)
 */
export function hashKeyForLogging(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8)
}

/**
 * Rotar clave maestra (encriptar con nueva clave y re-encriptar con la anterior)
 */
export function rotateMasterKey(
  encryptedData: EncryptedData,
  oldMasterKey: string,
  newMasterKey: string
): EncryptionResult {
  try {
    // 1. Desencriptar con clave antigua
    const decryptResult = decrypt(encryptedData, oldMasterKey)
    
    if (!decryptResult.success || !decryptResult.data) {
      return {
        success: false,
        error: "Error desencriptando con clave antigua: " + (decryptResult.error || "Error desconocido")
      }
    }
    
    // 2. Re-encriptar con nueva clave
    const encryptResult = encrypt(decryptResult.data, newMasterKey)
    
    if (!encryptResult.success) {
      return {
        success: false,
        error: "Error encriptando con nueva clave: " + (encryptResult.error || "Error desconocido")
      }
    }
    
    console.log("[Encryption] Rotación de clave exitosa")
    
    return encryptResult
    
  } catch (error) {
    console.error("[Encryption] Error en rotación de clave:", error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido en rotación"
    }
  }
}
