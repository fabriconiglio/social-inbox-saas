"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Inbox, User, Users, Clock, CheckCircle2, Search, Calendar, Loader2 } from "lucide-react"
import type { Channel, Local, Membership, User as UserType } from "@prisma/client"
import { useAdvancedFilters } from "@/hooks/use-advanced-filters"

interface InboxSidebarProps {
  tenantId: string
  locals: (Local & { channels: Channel[] })[]
  members: (Membership & { user: UserType })[]
}

export function InboxSidebar({ tenantId, locals, members }: InboxSidebarProps) {
  const { 
    filters, 
    searchQuery, 
    setSearchQuery, 
    isSearching,
    activeFiltersCount, 
    updateFilter, 
    clearFilters 
  } = useAdvancedFilters(tenantId)

  return (
    <div className="flex w-64 flex-col border-r bg-muted/30">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Bandeja de entrada</h2>
      </div>

      {/* Quick filters */}
      <div className="space-y-1 p-2">
        <Button
          variant={!filters.assignee && !filters.status ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => clearFilters()}
        >
          <Inbox className="mr-2 h-4 w-4" />
          Todas
        </Button>
        <Button
          variant={filters.assignee === "me" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => updateFilter("assignee", "me")}
        >
          <User className="mr-2 h-4 w-4" />
          Asignadas a mí
        </Button>
        <Button
          variant={filters.assignee === "unassigned" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => updateFilter("assignee", "unassigned")}
        >
          <Users className="mr-2 h-4 w-4" />
          Sin asignar
        </Button>
        <Button
          variant={filters.status === "open" || !filters.status ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => updateFilter("status", "open")}
        >
          <Clock className="mr-2 h-4 w-4" />
          Abiertas
        </Button>
        <Button
          variant={filters.status === "pending" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => updateFilter("status", "pending")}
        >
          <Clock className="mr-2 h-4 w-4" />
          Pendientes
        </Button>
        <Button
          variant={filters.status === "closed" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => updateFilter("status", "closed")}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Cerradas
        </Button>
      </div>

      {/* Advanced filters */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar conversaciones..."
              className="pl-8 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
            />
            {isSearching && (
              <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {isSearching && (
            <p className="text-xs text-muted-foreground">Buscando...</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="local">Local</Label>
          <Select
            value={filters.localId || "all"}
            onValueChange={(v) => updateFilter("localId", v === "all" ? null : v)}
          >
            <SelectTrigger id="local">
              <SelectValue placeholder="Todos los locales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los locales</SelectItem>
              {locals.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  {local.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="channel">Canal</Label>
          <Select
            value={filters.channel || "all"}
            onValueChange={(v) => updateFilter("channel", v === "all" ? null : v)}
          >
            <SelectTrigger id="channel">
              <SelectValue placeholder="Todos los canales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los canales</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="mock">Mock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            value={filters.status || "open"}
            onValueChange={(v) => updateFilter("status", v === "all" ? null : v)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abiertas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="closed">Cerradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignee">Asignado a</Label>
          <Select
            value={filters.assignee || "all"}
            onValueChange={(v) => updateFilter("assignee", v === "all" ? null : v)}
          >
            <SelectTrigger id="assignee">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="me">Yo</SelectItem>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.userId}>
                  {member.user.name || member.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateRange">Rango de fechas</Label>
          <Select
            value={filters.dateRange || "all"}
            onValueChange={(v) => updateFilter("dateRange", v === "all" ? null : v)}
          >
            <SelectTrigger id="dateRange">
              <SelectValue placeholder="Todos los tiempos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tiempos</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="yesterday">Ayer</SelectItem>
              <SelectItem value="thisWeek">Esta semana</SelectItem>
              <SelectItem value="lastWeek">Semana pasada</SelectItem>
              <SelectItem value="thisMonth">Este mes</SelectItem>
              <SelectItem value="lastMonth">Mes pasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filters.localId || filters.channel || filters.assignee || filters.status || filters.dateRange || filters.q) && (
          <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
            Limpiar filtros ({activeFiltersCount})
          </Button>
        )}
      </div>
    </div>
  )
}
