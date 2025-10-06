"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Music2,
  Plug,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react"
import { connectChannel, validateChannelCredentials } from "@/app/actions/channels"
import { toast } from "sonner"

interface ConnectChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  locals: Array<{
    id: string
    name: string
  }>
}

type ChannelType = "INSTAGRAM" | "FACEBOOK" | "WHATSAPP" | "TIKTOK" | "MOCK"

export function ConnectChannelDialog({
  open,
  onOpenChange,
  tenantId,
  locals,
}: ConnectChannelDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    status: "idle" | "success" | "error"
    message?: string
    details?: Record<string, any>
  }>({ status: "idle" })
  const [channelType, setChannelType] = useState<ChannelType | "">("")
  const [localId, setLocalId] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [config, setConfig] = useState({
    pageId: "",
    accessToken: "",
    phoneId: "",
    businessId: "",
    appId: "",
    appSecret: "",
  })

  const channelTypes = [
    { value: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-500" },
    { value: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-500" },
    { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
    { value: "TIKTOK", label: "TikTok", icon: Music2, color: "text-black dark:text-white" },
    { value: "MOCK", label: "Canal de Prueba", icon: Plug, color: "text-gray-500" },
  ]

  const getChannelIcon = (type: string) => {
    const channel = channelTypes.find((c) => c.value === type)
    if (!channel) return null
    const Icon = channel.icon
    return <Icon className={`h-4 w-4 ${channel.color}`} />
  }

  const getRequiredFieldsForChannelType = (type: string): string[] => {
    switch (type) {
      case "INSTAGRAM":
      case "FACEBOOK":
        return ["pageId", "accessToken"]
      case "WHATSAPP":
        return ["phoneId", "accessToken", "businessId"]
      case "TIKTOK":
        return ["appId", "appSecret", "accessToken"]
      case "MOCK":
        return []
      default:
        return []
    }
  }

  const resetForm = () => {
    setChannelType("")
    setLocalId("")
    setDisplayName("")
    setConfig({
      pageId: "",
      accessToken: "",
      phoneId: "",
      businessId: "",
      appId: "",
      appSecret: "",
    })
    setValidationResult({ status: "idle" })
  }

  // Resetear validación cuando cambie el tipo de canal o la configuración
  useEffect(() => {
    setValidationResult({ status: "idle" })
  }, [channelType, config.pageId, config.accessToken, config.phoneId, config.businessId, config.appId, config.appSecret])

  // Validar credenciales antes de conectar
  const handleValidate = async () => {
    if (!channelType) {
      toast.error("Selecciona un tipo de canal primero")
      return
    }

    setIsValidating(true)
    setValidationResult({ status: "idle" })

    const result = await validateChannelCredentials({
      tenantId,
      type: channelType,
      config: channelType === "MOCK" ? {} : config,
      enhanced: true, // Usar validación mejorada
    })

    if (result.success && (result as any).valid) {
      setValidationResult({
        status: "success",
        message: "Credenciales válidas",
        details: (result as any).details,
      })
      
      // Mostrar advertencias si las hay
      if ((result as any).warnings && (result as any).warnings.length > 0) {
        toast.warning(`Advertencias: ${(result as any).warnings.join(", ")}`)
      }
      
      // Mostrar recomendaciones si las hay
      if ((result as any).recommendations && (result as any).recommendations.length > 0) {
        console.log("Recomendaciones:", (result as any).recommendations)
      }
      
      toast.success("¡Credenciales validadas correctamente!")
    } else {
      setValidationResult({
        status: "error",
        message: result.error || "Error al validar credenciales",
      })
      toast.error(result.error || "Credenciales inválidas")
    }

    setIsValidating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!channelType || !localId || !displayName) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    // Si no es MOCK, validar que tenga credenciales básicas
    if (channelType !== "MOCK") {
      const requiredFields = getRequiredFieldsForChannelType(channelType)
      const missingFields = requiredFields.filter((field: string) => !config[field as keyof typeof config])
      
      if (missingFields.length > 0) {
        toast.error(`Faltan campos requeridos: ${missingFields.join(", ")}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Primero validar las credenciales con el sistema mejorado
      const validationResult = await validateChannelCredentials({
        tenantId,
        type: channelType,
        config: channelType === "MOCK" ? {} : config,
        enhanced: true,
      })

      if (!validationResult.success || !(validationResult as any).valid) {
        toast.error(validationResult.error || "Credenciales inválidas")
        setIsSubmitting(false)
        return
      }

      // Si hay advertencias, mostrar al usuario
      if ((validationResult as any).warnings && (validationResult as any).warnings.length > 0) {
        toast.warning(`Advertencias: ${(validationResult as any).warnings.join(", ")}`)
      }

      // Conectar el canal
      const result = await connectChannel({
        tenantId,
        localId,
        type: channelType,
        displayName,
        config: channelType === "MOCK" ? {} : config,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Canal conectado correctamente")
        
        // Mostrar recomendaciones si las hay
        if ((validationResult as any).recommendations && (validationResult as any).recommendations.length > 0) {
          console.log("Recomendaciones para el canal:", (validationResult as any).recommendations)
        }
        
        resetForm()
        onOpenChange(false)
        router.refresh()
      }
    } catch (error) {
      console.error("Error connecting channel:", error)
      toast.error("Error inesperado al conectar el canal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderConfigFields = () => {
    switch (channelType) {
      case "INSTAGRAM":
      case "FACEBOOK":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="pageId">Page ID</Label>
              <Input
                id="pageId"
                placeholder="123456789012345"
                value={config.pageId}
                onChange={(e) => setConfig({ ...config, pageId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ID de tu página de {channelType === "INSTAGRAM" ? "Instagram" : "Facebook"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Textarea
                id="accessToken"
                placeholder="EAABsbCS1iHgBO..."
                value={config.accessToken}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Token de acceso de tu aplicación de Meta
              </p>
            </div>
          </>
        )

      case "WHATSAPP":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="phoneId">Phone Number ID</Label>
              <Input
                id="phoneId"
                placeholder="123456789012345"
                value={config.phoneId}
                onChange={(e) => setConfig({ ...config, phoneId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessId">Business Account ID</Label>
              <Input
                id="businessId"
                placeholder="123456789012345"
                value={config.businessId}
                onChange={(e) => setConfig({ ...config, businessId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Textarea
                id="accessToken"
                placeholder="EAABsbCS1iHgBO..."
                value={config.accessToken}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </>
        )

      case "TIKTOK":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                placeholder="1234567890"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appSecret">App Secret</Label>
              <Input
                id="appSecret"
                type="password"
                placeholder="••••••••"
                value={config.appSecret}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Textarea
                id="accessToken"
                placeholder="act...."
                value={config.accessToken}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </>
        )

      case "MOCK":
        return (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <Plug className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              El canal de prueba no requiere configuración adicional.
              <br />
              Se creará listo para usar.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Conectar Nuevo Canal</DialogTitle>
            <DialogDescription>
              Configura un nuevo canal de mensajería para recibir y enviar mensajes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de Canal */}
            <div className="space-y-2">
              <Label htmlFor="channelType">Tipo de Canal *</Label>
              <Select value={channelType} onValueChange={(value) => setChannelType(value as ChannelType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo de canal" />
                </SelectTrigger>
                <SelectContent>
                  {channelTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(type.value)}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Local */}
            <div className="space-y-2">
              <Label htmlFor="local">Local *</Label>
              <Select value={localId} onValueChange={setLocalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un local" />
                </SelectTrigger>
                <SelectContent>
                  {locals.map((local) => (
                    <SelectItem key={local.id} value={local.id}>
                      {local.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sucursal a la que pertenece este canal
              </p>
            </div>

            {/* Nombre del Canal */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre del Canal *</Label>
              <Input
                id="displayName"
                placeholder="Ej: Instagram Sucursal Centro"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre descriptivo para identificar este canal
              </p>
            </div>

            {/* Configuración específica por tipo */}
            {channelType && (
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">Configuración de {channelTypes.find((t) => t.value === channelType)?.label}</h4>
                {renderConfigFields()}
                
                {/* Botón de validación y estado */}
                {channelType !== "MOCK" && (
                  <div className="space-y-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidate}
                      disabled={isValidating || isSubmitting}
                      className="w-full"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validando credenciales...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Validar Credenciales
                        </>
                      )}
                    </Button>

                    {/* Feedback de validación */}
                    {validationResult.status === "success" && (
                      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          <div className="space-y-1">
                            <p className="font-medium">{validationResult.message}</p>
                            {validationResult.details && (
                              <div className="text-xs space-y-0.5">
                                {Object.entries(validationResult.details).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationResult.status === "error" && (
                      <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                          <p className="font-medium">{validationResult.message}</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !channelType || !localId || !displayName}>
              {isSubmitting ? "Conectando..." : "Conectar Canal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
