"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  Clock,
  User,
  Hash,
  FileText,
  ExternalLink,
  Edit,
  Save,
  X
} from "lucide-react"
import { ContactConversationHistory } from "./contact-conversation-history"
import { getContact, updateContact } from "@/app/actions/contacts"
import { toast } from "sonner"
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

interface ContactDetailModalProps {
  contactId: string | null
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function ContactDetailModal({ 
  contactId, 
  tenantId, 
  open, 
  onOpenChange, 
  onContactUpdated 
}: ContactDetailModalProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  // Cargar contacto cuando cambie el ID
  useEffect(() => {
    if (contactId && open) {
      loadContact()
    }
  }, [contactId, open])

  const loadContact = async () => {
    if (!contactId) return
    
    setLoading(true)
    try {
      const result = await getContact(contactId, tenantId)
      if (result.error) {
        toast.error(result.error)
        onOpenChange(false)
        return
      }
      
      if (result.data) {
        setContact(result.data)
        setNotes(result.data.notes || "")
      }
    } catch (error) {
      toast.error("Error al cargar el contacto")
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!contact) return
    
    setSavingNotes(true)
    try {
      const result = await updateContact(tenantId, {
        id: contact.id,
        notes: notes.trim() || undefined,
      })
      
      if (result.error) {
        toast.error(result.error)
        return
      }
      
      toast.success("Notas actualizadas")
      setEditingNotes(false)
      setContact(prev => prev ? { ...prev, notes: notes.trim() || null } : null)
      onContactUpdated?.()
    } catch (error) {
      toast.error("Error al actualizar las notas")
    } finally {
      setSavingNotes(false)
    }
  }

  const handleCancelEdit = () => {
    setNotes(contact?.notes || "")
    setEditingNotes(false)
  }

  const handleViewThread = (threadId: string) => {
    // Abrir thread en nueva pestaña o navegar
    window.open(`/app/${tenantId}/inbox?thread=${threadId}`, '_blank')
  }

  const getInitials = (name?: string | null, handle?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return handle?.slice(0, 2).toUpperCase() || "??"
  }

  const getLastActivity = () => {
    if (!contact || contact.threads.length === 0) return "Sin conversaciones"
    
    const lastThread = contact.threads[0]
    return formatDistanceToNow(lastThread.lastMessageAt, { 
      addSuffix: true, 
      locale: es 
    })
  }

  const openThreads = contact?.threads.filter(t => t.status === "OPEN").length || 0
  const pendingThreads = contact?.threads.filter(t => t.status === "PENDING").length || 0
  const closedThreads = contact?.threads.filter(t => t.status === "CLOSED").length || 0

  if (!contact && !loading) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalle de Contacto
          </DialogTitle>
          <DialogDescription>
            Información completa y historial de conversaciones
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contact ? (
          <div className="space-y-6 overflow-auto max-h-[70vh]">
            {/* Header con información básica */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className={platformColors[contact.platform as keyof typeof platformColors]}>
                  {getInitials(contact.name, contact.handle)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-semibold truncate">
                  {contact.name || contact.handle}
                </h2>
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

                  {/* Notas editables */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Notas
                        </div>
                        {!editingNotes && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingNotes(true)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {editingNotes ? (
                        <div className="space-y-3">
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Agrega notas sobre este contacto..."
                            rows={4}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={handleSaveNotes}
                              disabled={savingNotes}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {savingNotes ? "Guardando..." : "Guardar"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={savingNotes}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {contact.notes ? (
                            <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No hay notas para este contacto. Haz clic en editar para agregar notas.
                            </p>
                          )}
                        </div>
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
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
