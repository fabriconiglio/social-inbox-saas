"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContactCard } from "./contact-card"
import { listContacts } from "@/app/actions/contacts"
import { Search, Filter, Plus, RefreshCw } from "lucide-react"
import { CreateContactDialog } from "./create-contact-dialog"
import { toast } from "sonner"

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

interface ContactsListProps {
  tenantId: string
  initialContacts?: Contact[]
  initialPagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export function ContactsList({ tenantId, initialContacts = [], initialPagination }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [pagination, setPagination] = useState(initialPagination || {
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [platform, setPlatform] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  // Cargar contactos
  const loadContacts = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const offset = reset ? 0 : pagination.offset
      const result = await listContacts(tenantId, {
        search: search || undefined,
        platform: platform === "all" ? undefined : platform,
        limit: pagination.limit,
        offset,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data) {
        const newContacts = reset ? result.data.contacts : [...contacts, ...result.data.contacts]
        setContacts(newContacts)
        setPagination(result.data.pagination)
      }
    } catch (error) {
      toast.error("Error al cargar contactos")
    } finally {
      setLoading(false)
    }
  }, [tenantId, search, platform, pagination.offset, pagination.limit, contacts])

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get("search") || "")) {
        loadContacts(true)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search, loadContacts, searchParams])

  // Efecto para filtro de plataforma
  useEffect(() => {
    loadContacts(true)
  }, [platform])

  // Actualizar URL con parámetros de búsqueda
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (platform !== "all") params.set("platform", platform)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    if (newUrl !== window.location.search) {
      router.replace(`${window.location.pathname}${newUrl}`, { scroll: false })
    }
  }, [search, platform, router])

  // Cargar parámetros iniciales desde URL
  useEffect(() => {
    const searchParam = searchParams.get("search")
    const platformParam = searchParams.get("platform")
    
    if (searchParam) setSearch(searchParam)
    if (platformParam) setPlatform(platformParam)
  }, [searchParams])

  const handleLoadMore = () => {
    if (!loading && pagination.hasMore) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))
      loadContacts(false)
    }
  }

  const handleContactUpdated = () => {
    loadContacts(true)
  }

  const handleRefresh = () => {
    loadContacts(true)
  }

  const getPlatformStats = () => {
    const stats = contacts.reduce((acc, contact) => {
      acc[contact.platform] = (acc[contact.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return stats
  }

  const platformStats = getPlatformStats()

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contactos</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} contacto(s) encontrado(s)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <CreateContactDialog tenantId={tenantId} onContactCreated={handleContactUpdated}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contacto
            </Button>
          </CreateContactDialog>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, handle, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas por plataforma */}
      {Object.keys(platformStats).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(platformStats).map(([platformName, count]) => (
            <Badge 
              key={platformName}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setPlatform(platformName)}
            >
              {platformName}: {count}
            </Badge>
          ))}
          {platform !== "all" && (
            <Badge 
              variant="outline"
              className="cursor-pointer"
              onClick={() => setPlatform("all")}
            >
              Ver todas
            </Badge>
          )}
        </div>
      )}

      {/* Lista de contactos */}
      {loading && contacts.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ContactCardSkeleton key={i} />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {search || platform !== "all" ? (
              <>
                <p className="text-lg font-medium">No se encontraron contactos</p>
                <p className="text-sm">Intenta con otros filtros de búsqueda</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No hay contactos</p>
                <p className="text-sm">Crea tu primer contacto para comenzar</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                tenantId={tenantId}
                onContactUpdated={handleContactUpdated}
              />
            ))}
          </div>

          {/* Botón cargar más */}
          {pagination.hasMore && (
            <div className="text-center pt-6">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? "Cargando..." : "Cargar más"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ContactCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex justify-between pt-2 border-t">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}
