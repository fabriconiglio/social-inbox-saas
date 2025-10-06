"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Music2,
  Plug,
  Settings,
  Trash2 
} from "lucide-react"
import { toggleChannelStatus, deleteChannel } from "@/app/actions/channels"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EditChannelDialog } from "./edit-channel-dialog"

interface ChannelCardProps {
  channel: {
    id: string
    type: string
    displayName: string
    status: string
    createdAt: Date
    meta: any
    local: {
      name: string
    }
  }
  tenantId: string
}

export function ChannelCard({ channel, tenantId }: ChannelCardProps) {
  const router = useRouter()
  const [isToggling, setIsToggling] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isActive = channel.status === "ACTIVE"
  const isError = channel.status === "ERROR"

  // Iconos por tipo de canal
  const getChannelIcon = () => {
    switch (channel.type) {
      case "INSTAGRAM":
        return <Instagram className="h-5 w-5" />
      case "FACEBOOK":
        return <Facebook className="h-5 w-5" />
      case "WHATSAPP":
        return <MessageCircle className="h-5 w-5" />
      case "TIKTOK":
        return <Music2 className="h-5 w-5" />
      case "MOCK":
        return <Plug className="h-5 w-5" />
      default:
        return <Plug className="h-5 w-5" />
    }
  }

  // Color del badge según estado
  const getStatusBadge = () => {
    if (isError) {
      return <Badge variant="destructive">Error</Badge>
    }
    if (isActive) {
      return <Badge className="bg-green-500">Activo</Badge>
    }
    return <Badge variant="secondary">Inactivo</Badge>
  }

  // Descripción según tipo de canal
  const getChannelDescription = () => {
    switch (channel.type) {
      case "INSTAGRAM":
        return "Mensajes directos de Instagram"
      case "FACEBOOK":
        return "Messenger de Facebook"
      case "WHATSAPP":
        return "WhatsApp Business Cloud API"
      case "TIKTOK":
        return "Mensajes directos de TikTok"
      case "MOCK":
        return "Canal de prueba para desarrollo"
      default:
        return "Canal de mensajería"
    }
  }

  const handleToggle = async (checked: boolean) => {
    if (isToggling) return
    
    setIsToggling(true)
    const result = await toggleChannelStatus(channel.id, tenantId)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(checked ? "Canal activado" : "Canal desactivado")
      router.refresh()
    }
    
    setIsToggling(false)
  }

  const handleEdit = () => {
    setShowEditDialog(true)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    const result = await deleteChannel(channel.id, tenantId)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Canal eliminado correctamente")
      router.refresh()
    }
    
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${
              isError ? "bg-destructive/10 text-destructive" :
              isActive ? "bg-primary/10 text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {getChannelIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{channel.displayName}</CardTitle>
              <CardDescription className="mt-1">
                {getChannelDescription()}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span className="font-medium text-foreground">{channel.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Local:</span>
            <span className="font-medium text-foreground">{channel.local.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Conectado:</span>
            <span className="font-medium text-foreground">
              {new Date(channel.createdAt).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isError || isToggling}
          />
          <span className="text-sm text-muted-foreground">
            {isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleEdit}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el canal "{channel.displayName}" 
              y todas las conversaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditChannelDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        tenantId={tenantId}
        channel={channel}
      />
    </Card>
  )
}

