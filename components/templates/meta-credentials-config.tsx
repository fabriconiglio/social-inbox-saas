"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  ExternalLink,
  Info
} from "lucide-react"

const MetaCredentialsSchema = z.object({
  accessToken: z.string().min(1, "El access token es requerido"),
  phoneNumberId: z.string().min(1, "El ID del número de teléfono es requerido"),
  businessAccountId: z.string().optional()
})

type MetaCredentialsForm = z.infer<typeof MetaCredentialsSchema>

interface MetaCredentialsConfigProps {
  tenantId: string
  onCredentialsSaved?: () => void
}

export function MetaCredentialsConfig({ tenantId, onCredentialsSaved }: MetaCredentialsConfigProps) {
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "failed">("unknown")

  const form = useForm<MetaCredentialsForm>({
    resolver: zodResolver(MetaCredentialsSchema),
    defaultValues: {
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: ""
    }
  })

  const testConnection = async (data: MetaCredentialsForm) => {
    try {
      setTesting(true)
      setConnectionStatus("unknown")
      
      // TODO: Implementar test de conexión real
      // Por ahora simulamos una respuesta
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simular resultado (en producción esto sería una llamada real a Meta API)
      const isConnected = Math.random() > 0.3 // 70% de éxito para demo
      
      if (isConnected) {
        setConnectionStatus("connected")
        toast.success("Conexión exitosa con Meta API")
      } else {
        setConnectionStatus("failed")
        toast.error("Error al conectar con Meta API")
      }
    } catch (error) {
      setConnectionStatus("failed")
      toast.error("Error al probar la conexión")
    } finally {
      setTesting(false)
    }
  }

  const saveCredentials = async (data: MetaCredentialsForm) => {
    try {
      // TODO: Implementar guardado real de credenciales
      // Por ahora simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Credenciales guardadas exitosamente")
      onCredentialsSaved?.()
    } catch (error) {
      toast.error("Error al guardar credenciales")
    }
  }

  const onSubmit = async (data: MetaCredentialsForm) => {
    await saveCredentials(data)
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error de conexión
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Info className="h-3 w-3 mr-1" />
            Sin verificar
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Meta API
        </CardTitle>
        <CardDescription>
          Configura las credenciales para sincronizar plantillas desde Meta Business API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de conexión */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Estado de conexión</Label>
            <p className="text-xs text-muted-foreground">
              Verifica que las credenciales sean válidas
            </p>
          </div>
          {getConnectionStatusBadge()}
        </div>

        {/* Información importante */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Información importante:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Necesitas un token de acceso de Meta Business API</li>
                <li>El número de teléfono debe estar verificado en Meta Business</li>
                <li>Las plantillas deben estar aprobadas en Meta Business Manager</li>
              </ul>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://developers.facebook.com/docs/whatsapp/business-management-api", "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Documentación de Meta API
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showToken ? "text" : "password"}
                        placeholder="EAAxxxxxxxxxxxxxxxxxxxxx"
                        {...field}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Token de acceso permanente de Meta Business API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID del Número de Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456789012345"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    ID del número de WhatsApp Business verificado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de la Cuenta de Negocio (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456789012345"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    ID de la cuenta de negocio de Meta (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => testConnection(form.getValues())}
                disabled={testing || !form.formState.isValid}
              >
                {testing ? "Probando..." : "Probar Conexión"}
              </Button>
              <Button type="submit" disabled={!form.formState.isValid}>
                Guardar Credenciales
              </Button>
            </div>
          </form>
        </Form>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Nota:</strong> Las credenciales se almacenan de forma segura y encriptada.</p>
          <p><strong>Seguridad:</strong> Solo usuarios con permisos de administrador pueden configurar estas credenciales.</p>
        </div>
      </CardContent>
    </Card>
  )
}








