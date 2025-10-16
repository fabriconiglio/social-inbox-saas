"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Edit,
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  Clock,
  User,
  Hash,
  FileText,
  ExternalLink
} from "lucide-react"
import { ContactConversationHistory } from "./contact-conversation-history"
import { EditContactDialog } from "./edit-contact-dialog"
import { formatDistanceToNow, format } from "date-fns"
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
    createdAt: Date
    channel: {
      displayName: string
      type: string
    }
    assignee?: {
      name?: string | null
      email?: string | null
    } | null
    messages: Array<{
      id: string
      direction: string
      body: string
      sentAt: Date
      authorId?: string | null
    }>
    _count: {
      messages: number
    }
  }>
  _count: {
    threads: number
  }
}

interface ContactDetailProps {
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
  OPEN: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels = {
  OPEN: "Abierto",
  PENDING: "Pendiente",
  CLOSED: "Cerrado",
}

export function ContactDetail({ contact, tenantId, onContactUpdated }: ContactDetailProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const router = useRouter()

  const getInitials = (name?: string | null, handle?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return handle?.slice(0, 2).toUpperCase() || "??"
  }

  const handleBack = () => {
    router.push(`/app/${tenantId}/contacts`)
  }

  const handleViewThread = (threadId: string) => {
    router.push(`/app/${tenantId}/inbox?thread=${threadId}`)
  }

  const handleViewAllThreads = () => {
    router.push(`/app/${tenantId}/inbox?contact=${contact.id}`)
  }

  const getLastActivity = () => {
    if (contact.threads.length === 0) return "Sin conversaciones"
    
    const lastThread = contact.threads[0]
    return formatDistanceToNow(lastThread.lastMessageAt, { 
      addSuffix: true, 
      locale: es 
    })
  }

  const openThreads = contact.threads.filter(t => t.status === "OPEN").length
  const pendingThreads = contact.threads.filter(t => t.status === "PENDING").length
  const closedThreads = contact.threads.filter(t => t.status === "CLOSED").length

  return (
    <>
      <div className="space-y-6">
        {/* Header con información básica */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className={platformColors[contact.platform as keyof typeof platformColors]}>
              {getInitials(contact.name, contact.handle)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold truncate">
                  {contact.name || contact.handle}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {platformIcons[contact.platform as keyof typeof platformIcons]} {contact.platform}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    @{contact.handle}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Última actividad: {getLastActivity()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contact._count.threads}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Abiertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{openThreads}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingThreads}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cerradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{closedThreads}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con información detallada */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="conversations">Conversaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Información de contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Handle</p>
                      <p className="text-sm text-muted-foreground">@{contact.handle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Creado</p>
                      <p className="text-sm text-muted-foreground">
                        {format(contact.createdAt, "PPP", { locale: es })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No hay notas para este contacto
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversations" className="space-y-4">
            <ContactConversationHistory
              contactId={contact.id}
              tenantId={tenantId}
              threads={contact.threads}
              onThreadClick={handleViewThread}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <EditContactDialog
        contact={contact}
        tenantId={tenantId}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onContactUpdated={onContactUpdated}
      />
    </>
  )
}
