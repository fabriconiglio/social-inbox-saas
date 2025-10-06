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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Music2,
  Plug 
} from "lucide-react"
import { updateChannel } from "@/app/actions/channels"
import { toast } from "sonner"

interface EditChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  channel: {
    id: string
    type: string
    displayName: string
    meta: any
  }
}

export function EditChannelDialog({
  open,
  onOpenChange,
  tenantId,
  channel,
}: EditChannelDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayName, setDisplayName] = useState(channel.displayName)
  const [config, setConfig] = useState<Record<string, any>>({})

  // Inicializar config cuando se abre el dialog
  useEffect(() => {
    if (open) {
      setDisplayName(channel.displayName)
      setConfig(channel.meta || {})
    }
  }, [open, channel])

  const getChannelIcon = () => {
    switch (channel.type) {
      case "INSTAGRAM":
        return <Instagram className="h-5 w-5 text-pink-500" />
      case "FACEBOOK":
        return <Facebook className="h-5 w-5 text-blue-500" />
      case "WHATSAPP":
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case "TIKTOK":
        return <Music2 className="h-5 w-5" />
      case "MOCK":
        return <Plug className="h-5 w-5 text-gray-500" />
      default:
        return null
    }
  }

  const getChannelLabel = () => {
    switch (channel.type) {
      case "INSTAGRAM":
        return "Instagram"
      case "FACEBOOK":
        return "Facebook"
      case "WHATSAPP":
        return "WhatsApp"
      case "TIKTOK":
        return "TikTok"
      case "MOCK":
        return "Canal de Prueba"
      default:
        return channel.type
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!displayName.trim()) {
      toast.error("El nombre del canal es requerido")
      return
    }

    setIsSubmitting(true)

    const result = await updateChannel({
      channelId: channel.id,
      tenantId,
      displayName,
      config: channel.type === "MOCK" ? {} : config,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Canal actualizado correctamente")
      onOpenChange(false)
      router.refresh()
    }

    setIsSubmitting(false)
  }

  const renderConfigFields = () => {
    switch (channel.type) {
      case "INSTAGRAM":
      case "FACEBOOK":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="pageId">Page ID</Label>
              <Input
                id="pageId"
                placeholder="123456789012345"
                value={config.pageId || ""}
                onChange={(e) => setConfig({ ...config, pageId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ID de tu página de {channel.type === "INSTAGRAM" ? "Instagram" : "Facebook"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Textarea
                id="accessToken"
                placeholder="EAABsbCS1iHgBO..."
                value={config.accessToken || ""}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="font-mono text-xs"
                rows={3}
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
                value={config.phoneId || ""}
                onChange={(e) => setConfig({ ...config, phoneId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessId">Business Account ID</Label>
              <Input
                id="businessId"
                placeholder="123456789012345"
                value={config.businessId || ""}
                onChange={(e) => setConfig({ ...config, businessId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Textarea
                id="accessToken"
                placeholder="EAABsbCS1iHgBO..."
                value={config.accessToken || ""}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="font-mono text-xs"
                rows={3}
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
                value={config.appId || ""}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appSecret">App Secret</Label>
              <Input
                id="appSecret"
                type="password"
                placeholder="••••••••"
                value={config.appSecret || ""}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Textarea
                id="accessToken"
                placeholder="act...."
                value={config.accessToken || ""}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="font-mono text-xs"
                rows={3}
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
            <DialogTitle className="flex items-center gap-2">
              {getChannelIcon()}
              Editar Canal
            </DialogTitle>
            <DialogDescription>
              Actualiza la configuración de tu canal {getChannelLabel()}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Configuración de {getChannelLabel()}</h4>
              {renderConfigFields()}
            </div>

            {/* Info adicional */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Tipo de canal: {getChannelLabel()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                No puedes cambiar el tipo de canal una vez creado
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !displayName.trim()}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
