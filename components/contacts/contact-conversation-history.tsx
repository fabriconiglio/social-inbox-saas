"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Search,
  Filter,
  MessageSquare,
  Clock,
  User,
  ExternalLink,
  Calendar,
  TrendingUp,
  Users,
  Hash,
  Eye
} from "lucide-react"
import { formatDistanceToNow, format, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"

interface ConversationThread {
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
}

interface ContactConversationHistoryProps {
  contactId: string
  tenantId: string
  threads: ConversationThread[]
  onThreadClick?: (threadId: string) => void
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

const platformIcons = {
  INSTAGRAM: "📷",
  FACEBOOK: "👥", 
  WHATSAPP: "💬",
  TIKTOK: "🎵",
  MOCK: "🔧",
}

export function ContactConversationHistory({ 
  contactId, 
  tenantId, 
  threads, 
  onThreadClick 
}: ContactConversationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [filteredThreads, setFilteredThreads] = useState<ConversationThread[]>(threads)

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...threads]

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(thread => 
        thread.messages.some(msg => 
          msg.body.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        thread.channel.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thread.assignee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter(thread => thread.status === statusFilter.toUpperCase())
    }

    // Filtro por fecha
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case "today":
          startDate = startOfDay(now)
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter(thread => 
        thread.lastMessageAt >= startDate
      )
    }

    // Ordenar por fecha de último mensaje
    filtered.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())

    setFilteredThreads(filtered)
  }, [threads, searchTerm, statusFilter, dateFilter])

  const handleThreadClick = (threadId: string) => {
    if (onThreadClick) {
      onThreadClick(threadId)
    } else {
      // Abrir en nueva pestaña por defecto
      window.open(`/app/${tenantId}/inbox?thread=${threadId}`, '_blank')
    }
  }

  const getConversationStats = () => {
    const total = threads.length
    const open = threads.filter(t => t.status === "OPEN").length
    const pending = threads.filter(t => t.status === "PENDING").length
    const closed = threads.filter(t => t.status === "CLOSED").length
    const totalMessages = threads.reduce((sum, t) => sum + t._count.messages, 0)
    
    return { total, open, pending, closed, totalMessages }
  }

  const getAssigneeInitials = (assignee?: { name?: string | null; email?: string | null } | null) => {
    if (!assignee) return "??"
    if (assignee.name) {
      return assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return assignee.email?.slice(0, 2).toUpperCase() || "??"
  }

  const stats = getConversationStats()

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mensajes Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.open + stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Promedio Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round(stats.totalMessages / stats.total) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar en conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Abiertas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="closed">Cerradas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline de conversaciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Historial de Conversaciones ({filteredThreads.length})
          </h3>
        </div>

        {filteredThreads.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
                  ? "No se encontraron conversaciones con estos filtros"
                  : "Este contacto no tiene conversaciones aún"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredThreads.map((thread) => (
              <Card key={thread.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4" onClick={() => handleThreadClick(thread.id)}>
                  <div className="flex items-start gap-4">
                    {/* Avatar del canal */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted">
                        {platformIcons[thread.channel.type as keyof typeof platformIcons] || "📱"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header de la conversación */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="secondary"
                          className={statusColors[thread.status as keyof typeof statusColors]}
                        >
                          {statusLabels[thread.status as keyof typeof statusLabels]}
                        </Badge>
                        <span className="text-sm font-medium">
                          {thread.channel.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {thread._count.messages} mensaje(s)
                        </span>
                      </div>

                      {/* Último mensaje */}
                      {thread.messages.length > 0 && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {thread.messages[0].body}
                        </p>
                      )}

                      {/* Footer con información */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(thread.lastMessageAt, { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(thread.createdAt, "dd/MM/yyyy", { locale: es })}
                        </div>

                        {thread.assignee && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {thread.assignee.name || thread.assignee.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {thread.assignee && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getAssigneeInitials(thread.assignee)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
