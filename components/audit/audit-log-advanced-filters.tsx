"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Filter, 
  Search, 
  X, 
  Calendar,
  User,
  Database,
  Activity,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"

interface AuditLogAdvancedFiltersProps {
  onFiltersChange: (filters: AuditLogFilters) => void
  onExport: () => void
  onClear: () => void
  className?: string
  initialFilters?: AuditLogFilters
}

export interface AuditLogFilters {
  entity?: string
  entityId?: string
  action?: string
  actor?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  includeDetails?: boolean
  includeDiffs?: boolean
}

const ENTITY_OPTIONS = [
  { value: "all", label: "Todas las entidades", icon: Database, color: "bg-gray-100" },
  { value: "Channel", label: "Canales", icon: Database, color: "bg-blue-100" },
  { value: "Thread", label: "Threads", icon: Activity, color: "bg-green-100" },
  { value: "Template", label: "Plantillas", icon: Database, color: "bg-purple-100" },
  { value: "Contact", label: "Contactos", icon: User, color: "bg-orange-100" },
  { value: "SLA", label: "SLA", icon: Activity, color: "bg-red-100" },
  { value: "CannedResponse", label: "Respuestas Rápidas", icon: Database, color: "bg-yellow-100" },
  { value: "User", label: "Usuarios", icon: User, color: "bg-indigo-100" },
  { value: "Tenant", label: "Tenant", icon: Database, color: "bg-pink-100" },
  { value: "Local", label: "Locales", icon: Database, color: "bg-cyan-100" }
]

const ACTION_OPTIONS = [
  { value: "all", label: "Todas las acciones", color: "bg-gray-100" },
  { value: "created", label: "Creaciones", color: "bg-green-100" },
  { value: "updated", label: "Actualizaciones", color: "bg-blue-100" },
  { value: "deleted", label: "Eliminaciones", color: "bg-red-100" },
  { value: "assigned", label: "Asignaciones", color: "bg-purple-100" },
  { value: "status", label: "Cambios de estado", color: "bg-orange-100" },
  { value: "credentials", label: "Credenciales", color: "bg-yellow-100" },
  { value: "approved", label: "Aprobaciones", color: "bg-green-100" },
  { value: "rejected", label: "Rechazos", color: "bg-red-100" },
  { value: "synced", label: "Sincronizaciones", color: "bg-blue-100" },
  { value: "used", label: "Uso", color: "bg-purple-100" }
]

const LIMIT_OPTIONS = [
  { value: 20, label: "20 registros" },
  { value: 50, label: "50 registros" },
  { value: 100, label: "100 registros" },
  { value: 200, label: "200 registros" },
  { value: 500, label: "500 registros" }
]

export function AuditLogAdvancedFilters({ 
  onFiltersChange, 
  onExport, 
  onClear,
  className,
  initialFilters
}: AuditLogAdvancedFiltersProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    entity: "all",
    action: "all",
    limit: 50,
    includeDetails: true,
    includeDiffs: false,
    ...initialFilters
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showEntityDetails, setShowEntityDetails] = useState(false)

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleFilterChange = (key: keyof AuditLogFilters, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setFilters(prev => ({
      ...prev,
      dateFrom: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      dateTo: range?.to ? format(range.to, "yyyy-MM-dd") : undefined
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      entity: "all",
      action: "all",
      limit: 50,
      includeDetails: true,
      includeDiffs: false
    })
    setDateRange(undefined)
    onClear()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.entity && filters.entity !== "all") count++
    if (filters.action && filters.action !== "all") count++
    if (filters.actor) count++
    if (filters.entityId) count++
    if (filters.dateFrom || filters.dateTo) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  const selectedEntity = ENTITY_OPTIONS.find(e => e.value === filters.entity)
  const selectedAction = ACTION_OPTIONS.find(a => a.value === filters.action)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros Avanzados de Auditoría</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showAdvanced ? "Ocultar" : "Mostrar"} Avanzados
            </Button>
          </div>
        </div>
        <CardDescription>
          Filtra el historial de auditoría con opciones avanzadas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entidad</Label>
            <Select 
              value={filters.entity || "all"} 
              onValueChange={(value) => handleFilterChange("entity", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar entidad" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${option.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Acción</Label>
            <Select 
              value={filters.action || "all"} 
              onValueChange={(value) => handleFilterChange("action", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar acción" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${option.color}`}></div>
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Límite</Label>
            <Select 
              value={filters.limit?.toString() || "50"} 
              onValueChange={(value) => handleFilterChange("limit", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateRange">Rango de Fechas</Label>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={handleDateRangeChange}
              placeholder="Seleccionar fechas"
            />
          </div>
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Filtros Avanzados</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entityId">ID de Entidad</Label>
                <Input
                  id="entityId"
                  placeholder="ID específico de entidad"
                  value={filters.entityId || ""}
                  onChange={(e) => handleFilterChange("entityId", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actor">Usuario</Label>
                <Input
                  id="actor"
                  placeholder="Nombre o email del usuario"
                  value={filters.actor || ""}
                  onChange={(e) => handleFilterChange("actor", e.target.value)}
                />
              </div>
            </div>

            {/* Opciones de exportación */}
            <div className="space-y-3">
              <Label>Opciones de Exportación</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={filters.includeDetails}
                    onCheckedChange={(checked) => handleFilterChange("includeDetails", checked)}
                  />
                  <Label htmlFor="includeDetails" className="text-sm">
                    Incluir detalles completos
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDiffs"
                    checked={filters.includeDiffs}
                    onCheckedChange={(checked) => handleFilterChange("includeDiffs", checked)}
                  />
                  <Label htmlFor="includeDiffs" className="text-sm">
                    Incluir diffs de cambios
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros activos */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2">
            <Label>Filtros Activos</Label>
            <div className="flex flex-wrap gap-2">
              {filters.entity && filters.entity !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Entidad: {selectedEntity?.label}
                  <button
                    onClick={() => handleFilterChange("entity", "all")}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.action && filters.action !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Acción: {selectedAction?.label}
                  <button
                    onClick={() => handleFilterChange("action", "all")}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.actor && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Usuario: {filters.actor}
                  <button
                    onClick={() => handleFilterChange("actor", "")}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.entityId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  ID: {filters.entityId}
                  <button
                    onClick={() => handleFilterChange("entityId", "")}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Fechas: {filters.dateFrom} - {filters.dateTo}
                  <button
                    onClick={() => {
                      handleFilterChange("dateFrom", "")
                      handleFilterChange("dateTo", "")
                      setDateRange(undefined)
                    }}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button onClick={() => onFiltersChange(filters)}>
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
          
          <Button variant="outline" onClick={handleClearFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpiar Todo
          </Button>
          
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
