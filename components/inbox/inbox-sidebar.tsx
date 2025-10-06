"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { Inbox, User, Users, Clock, CheckCircle2, Search } from "lucide-react"
import type { Channel, Local, Membership, User as UserType } from "@prisma/client"

interface InboxSidebarProps {
  tenantId: string
  locals: (Local & { channels: Channel[] })[]
  members: (Membership & { user: UserType })[]
  filters: {
    localId?: string
    channel?: string
    status?: string
    assignee?: string
    q?: string
  }
}

export function InboxSidebar({ tenantId, locals, members, filters }: InboxSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/app/${tenantId}/inbox?${params.toString()}`)
  }

  function clearFilters() {
    router.push(`/app/${tenantId}/inbox`)
  }

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
          variant={filters.status === "open" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => updateFilter("status", "open")}
        >
          <Clock className="mr-2 h-4 w-4" />
          Abiertas
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
              placeholder="Buscar..."
              className="pl-8"
              defaultValue={filters.q}
              onChange={(e) => {
                const value = e.target.value
                setTimeout(() => updateFilter("q", value || null), 500)
              }}
            />
          </div>
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

        {(filters.localId || filters.channel || filters.assignee || filters.status || filters.q) && (
          <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
