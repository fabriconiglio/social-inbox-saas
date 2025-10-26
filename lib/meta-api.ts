/**
 * Meta API Service
 * Maneja la conexión y sincronización con Meta Business API
 */

interface MetaTemplate {
  id: string
  name: string
  status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED"
  category: "AUTHENTICATION" | "MARKETING" | "UTILITY"
  language: string
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
    text?: string
    format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"
    buttons?: Array<{
      type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"
      text: string
      url?: string
      phone_number?: string
    }>
  }>
  created_at: string
  modified_at: string
}

interface MetaAPIResponse {
  data: MetaTemplate[]
  paging?: {
    cursors?: {
      before?: string
      after?: string
    }
    next?: string
  }
}

interface MetaAPIConfig {
  accessToken: string
  phoneNumberId: string
  businessAccountId?: string
}

export class MetaAPIService {
  private config: MetaAPIConfig
  private baseURL = "https://graph.facebook.com/v18.0"

  constructor(config: MetaAPIConfig) {
    this.config = config
  }

  /**
   * Obtiene todas las plantillas aprobadas de WhatsApp Business
   */
  async getApprovedTemplates(): Promise<MetaTemplate[]> {
    try {
      const url = `${this.baseURL}/${this.config.phoneNumberId}/message_templates`
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        status: "APPROVED",
        limit: "100"
      })

      const response = await fetch(`${url}?${params}`)
      
      if (!response.ok) {
        throw new Error(`Meta API Error: ${response.status} ${response.statusText}`)
      }

      const data: MetaAPIResponse = await response.json()
      return data.data || []
    } catch (error) {
      console.error("[Meta API] Error fetching templates:", error)
      throw new Error("Failed to fetch templates from Meta API")
    }
  }

  /**
   * Obtiene plantillas por estado específico
   */
  async getTemplatesByStatus(status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED"): Promise<MetaTemplate[]> {
    try {
      const url = `${this.baseURL}/${this.config.phoneNumberId}/message_templates`
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        status,
        limit: "100"
      })

      const response = await fetch(`${url}?${params}`)
      
      if (!response.ok) {
        throw new Error(`Meta API Error: ${response.status} ${response.statusText}`)
      }

      const data: MetaAPIResponse = await response.json()
      return data.data || []
    } catch (error) {
      console.error(`[Meta API] Error fetching ${status} templates:`, error)
      throw new Error(`Failed to fetch ${status} templates from Meta API`)
    }
  }

  /**
   * Obtiene una plantilla específica por ID
   */
  async getTemplateById(templateId: string): Promise<MetaTemplate | null> {
    try {
      const url = `${this.baseURL}/${templateId}`
      const params = new URLSearchParams({
        access_token: this.config.accessToken
      })

      const response = await fetch(`${url}?${params}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Meta API Error: ${response.status} ${response.statusText}`)
      }

      const data: MetaTemplate = await response.json()
      return data
    } catch (error) {
      console.error("[Meta API] Error fetching template:", error)
      throw new Error("Failed to fetch template from Meta API")
    }
  }

  /**
   * Convierte una plantilla de Meta al formato interno
   */
  convertMetaTemplateToInternal(metaTemplate: MetaTemplate, channelType: string) {
    // Extraer el texto del body
    const bodyComponent = metaTemplate.components.find(c => c.type === "BODY")
    const headerComponent = metaTemplate.components.find(c => c.type === "HEADER")
    const footerComponent = metaTemplate.components.find(c => c.type === "FOOTER")
    const buttonComponents = metaTemplate.components.find(c => c.type === "BUTTONS")

    // Construir el contenido del mensaje
    let content = ""
    if (headerComponent?.text) {
      content += headerComponent.text + "\n\n"
    }
    if (bodyComponent?.text) {
      content += bodyComponent.text
    }
    if (footerComponent?.text) {
      content += "\n\n" + footerComponent.text
    }

    // Extraer variables del texto (formato {{1}}, {{2}}, etc.)
    const variables: string[] = []
    const variableMatches = content.match(/\{\{(\d+)\}\}/g)
    if (variableMatches) {
      variables.push(...variableMatches.map(match => match.replace(/[{}]/g, '')))
    }

    // Determinar el tipo de plantilla
    let templateType = "text"
    if (headerComponent?.format && headerComponent.format !== "TEXT") {
      templateType = "media"
    }
    if (buttonComponents?.buttons && buttonComponents.buttons.length > 0) {
      templateType = "interactive"
    }

    // Construir contentJSON
    const contentJSON: any = {
      type: templateType,
      text: content,
      variables: variables,
      metaId: metaTemplate.id,
      category: metaTemplate.category,
      language: metaTemplate.language
    }

    // Agregar botones si existen
    if (buttonComponents?.buttons) {
      contentJSON.buttons = buttonComponents.buttons.map(button => ({
        type: button.type,
        text: button.text,
        url: button.url,
        phone_number: button.phone_number
      }))
    }

    // Agregar formato de header si es multimedia
    if (headerComponent?.format && headerComponent.format !== "TEXT") {
      contentJSON.headerFormat = headerComponent.format
    }

    return {
      name: metaTemplate.name,
      channelType,
      contentJSON,
      approvedTag: metaTemplate.status,
      metaId: metaTemplate.id,
      category: metaTemplate.category,
      language: metaTemplate.language,
      createdAt: new Date(metaTemplate.created_at),
      updatedAt: new Date(metaTemplate.modified_at)
    }
  }

  /**
   * Sincroniza todas las plantillas aprobadas
   */
  async syncApprovedTemplates(channelType: string): Promise<{
    synced: number
    templates: any[]
  }> {
    try {
      const metaTemplates = await this.getApprovedTemplates()
      const convertedTemplates = metaTemplates.map(template => 
        this.convertMetaTemplateToInternal(template, channelType)
      )

      return {
        synced: convertedTemplates.length,
        templates: convertedTemplates
      }
    } catch (error) {
      console.error("[Meta API] Error syncing templates:", error)
      throw error
    }
  }

  /**
   * Verifica la conexión con Meta API
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseURL}/${this.config.phoneNumberId}`
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: "id,name"
      })

      const response = await fetch(`${url}?${params}`)
      return response.ok
    } catch (error) {
      console.error("[Meta API] Connection test failed:", error)
      return false
    }
  }

  /**
   * Obtiene información del número de teléfono
   */
  async getPhoneNumberInfo(): Promise<{
    id: string
    name: string
    display_phone_number: string
  } | null> {
    try {
      const url = `${this.baseURL}/${this.config.phoneNumberId}`
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: "id,name,display_phone_number"
      })

      const response = await fetch(`${url}?${params}`)
      
      if (!response.ok) {
        throw new Error(`Meta API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("[Meta API] Error fetching phone number info:", error)
      return null
    }
  }
}

/**
 * Factory function para crear instancia de MetaAPIService
 */
export function createMetaAPIService(config: MetaAPIConfig): MetaAPIService {
  return new MetaAPIService(config)
}

/**
 * Utilidades para manejar credenciales de Meta
 */
export class MetaCredentialsManager {
  /**
   * Obtiene las credenciales de Meta para un tenant
   */
  static async getCredentialsForTenant(tenantId: string): Promise<MetaAPIConfig | null> {
    try {
      // TODO: Implementar lógica para obtener credenciales desde la base de datos
      // Por ahora retornamos null para indicar que no hay credenciales configuradas
      return null
    } catch (error) {
      console.error("[Meta Credentials] Error:", error)
      return null
    }
  }

  /**
   * Valida las credenciales de Meta
   */
  static async validateCredentials(config: MetaAPIConfig): Promise<boolean> {
    try {
      const service = new MetaAPIService(config)
      return await service.testConnection()
    } catch (error) {
      console.error("[Meta Credentials] Validation failed:", error)
      return false
    }
  }
}
