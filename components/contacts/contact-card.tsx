"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ContactDetailModal } from "./contact-detail-modal"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { EditContactDialog } from "./edit-contact-dialog"
import { deleteContact } from "@/app/actions/contacts"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Contact {
  id: string
  name?: string | null
  handle: string
  platform: string
  phone?: string | null
  email?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  threads: Array<{
    id: string
    status: string
    lastMessageAt: Date
  }>
  _count: {
    threads: number
  }
}

interface ContactCardProps {
  contact: Contact
  tenantId: string
  onContactUpdated?: () => void
}

const platformIcons = {
  instagram: "📷",
  facebook: "👥", 
  whatsapp: "💬",
  tiktok: "🎵",
}

const platformColors = {
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
  whatsapp: "bg-green-600",
  tiktok: "bg-black",
}

const statusColors = {
  OPEN: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800", 
  CLOSED: "bg-gray-100 text-gray-800",
}

export function ContactCard({ contact, tenantId, onContactUpdated }: ContactCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteContact(contact.id, tenantId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Contacto eliminado")
        onContactUpdated?.()
      }
    } catch (error) {
      toast.error("Error al eliminar contacto")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleViewDetail = () => {
    setShowDetailModal(true)
  }

  const handleViewThreads = () => {
    router.push(`/app/${tenantId}/inbox?contact=${contact.id}`)
  }

  const getInitials = (name?: string | null, handle?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return handle?.slice(0, 2).toUpperCase() || "??"
  }

  const getLastActivity = () => {
    if (contact.threads.length === 0) return "Sin conversaciones"
    
    const lastThread = contact.threads[0]
    return formatDistanceToNow(lastThread.lastMessageAt, { 
      addSuffix: true, 
      locale: es 
    })
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={platformColors[contact.platform as keyof typeof platformColors]}>
                  {getInitials(contact.name, contact.handle)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {contact.name || contact.handle}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {platformIcons[contact.platform as keyof typeof platformIcons]} {contact.platform}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    @{contact.handle}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetail}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewThreads}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ver conversaciones
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0" onClick={handleViewDetail}>
          <div className="space-y-3">
            {/* Información de contacto */}
            <div className="space-y-2">
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
            </div>

            {/* Notas */}
            {contact.notes && (
              <div className="text-sm text-muted-foreground">
                <p className="line-clamp-2">{contact.notes}</p>
              </div>
            )}

            {/* Estadísticas */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{contact._count.threads} conversación(es)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{getLastActivity()}</span>
                </div>
              </div>
            </div>

            {/* Estados de conversaciones activas */}
            {contact.threads.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {contact.threads.slice(0, 3).map((thread) => (
                  <Badge 
                    key={thread.id}
                    variant="secondary"
                    className={`text-xs ${statusColors[thread.status as keyof typeof statusColors]}`}
                  >
                    {thread.status === "OPEN" ? "Abierto" : 
                     thread.status === "PENDING" ? "Pendiente" : "Cerrado"}
                  </Badge>
                ))}
                {contact.threads.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{contact.threads.length - 3} más
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditContactDialog
        contact={contact}
        tenantId={tenantId}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onContactUpdated={onContactUpdated}
      />

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contactId={showDetailModal ? contact.id : null}
        tenantId={tenantId}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onContactUpdated={onContactUpdated}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el contacto{" "}
              <strong>{contact.name || contact.handle}</strong>.
              {contact._count.threads > 0 && (
                <span className="block mt-2 text-red-600">
                  ⚠️ Este contacto tiene {contact._count.threads} conversación(es) y no se puede eliminar.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || contact._count.threads > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
