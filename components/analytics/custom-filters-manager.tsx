"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Settings, Plus, Save, Trash2, Edit, Filter, Star, StarOff } from "lucide-react"
import { toast } from "sonner"
import { CustomFilter, getCustomFilters, saveCustomFilters, addCustomFilter, updateCustomFilter, deleteCustomFilter, generateFilterName, validateFilter, FILTER_PRESETS } from "@/lib/filter-utils"

interface CustomFiltersManagerProps {
  currentFilters: any
  onFilterApply: (filters: any) => void
  className?: string
}

export function CustomFiltersManager({
  currentFilters,
  onFilterApply,
  className
}: CustomFiltersManagerProps) {
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFilter, setEditingFilter] = useState<CustomFilter | null>(null)
  const [deleteFilterId, setDeleteFilterId] = useState<string | null>(null)
  
  // Form state
  const [filterName, setFilterName] = useState("")
  const [filterDescription, setFilterDescription] = useState("")
  const [filterData, setFilterData] = useState<any>({})

  useEffect(() => {
    setCustomFilters(getCustomFilters())
  }, [])

  const handleSaveFilter = () => {
    const validation = validateFilter(filterData)
    if (!validation.isValid) {
      toast.error(`Error en el filtro: ${validation.errors.join(', ')}`)
      return
    }

    const name = filterName || generateFilterName(filterData)
    const description = filterDescription || `Filtro personalizado: ${name}`

    try {
      if (editingFilter) {
        const updated = updateCustomFilter(editingFilter.id, {
          name,
          description,
          filters: filterData
        })
        if (updated) {
          setCustomFilters(getCustomFilters())
          toast.success("Filtro actualizado exitosamente")
        }
      } else {
        const newFilter = addCustomFilter({
          name,
          description,
          filters: filterData
        })
        setCustomFilters(prev => [...prev, newFilter])
        toast.success("Filtro guardado exitosamente")
      }
      
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Error al guardar el filtro")
    }
  }

  const handleDeleteFilter = (id: string) => {
    try {
      if (deleteCustomFilter(id)) {
        setCustomFilters(getCustomFilters())
        toast.success("Filtro eliminado exitosamente")
      }
    } catch (error) {
      toast.error("Error al eliminar el filtro")
    }
    setDeleteFilterId(null)
  }

  const handleApplyFilter = (filter: CustomFilter) => {
    onFilterApply(filter.filters)
    toast.success(`Filtro "${filter.name}" aplicado`)
  }

  const handleApplyPreset = (preset: any) => {
    onFilterApply(preset.filters)
    toast.success(`Preset "${preset.name}" aplicado`)
  }

  const handleEditFilter = (filter: CustomFilter) => {
    setEditingFilter(filter)
    setFilterName(filter.name)
    setFilterDescription(filter.description || "")
    setFilterData(filter.filters)
    setIsDialogOpen(true)
  }

  const handleSaveCurrentAsFilter = () => {
    setFilterName("")
    setFilterDescription("")
    setFilterData(currentFilters)
    setEditingFilter(null)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFilterName("")
    setFilterDescription("")
    setFilterData({})
    setEditingFilter(null)
  }

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Filtros Personalizados
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFilter ? "Editar Filtro" : "Guardar Filtro Personalizado"}
            </DialogTitle>
            <DialogDescription>
              {editingFilter 
                ? "Modifica los criterios de tu filtro personalizado"
                : "Guarda la configuración actual como un filtro reutilizable"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterName">Nombre del filtro</Label>
                <Input
                  id="filterName"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder={generateFilterName(filterData)}
                />
              </div>
              <div>
                <Label htmlFor="filterDescription">Descripción (opcional)</Label>
                <Input
                  id="filterDescription"
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  placeholder="Describe el propósito de este filtro"
                />
              </div>
            </div>

            <div>
              <Label>Configuración actual del filtro</Label>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <pre className="text-sm text-muted-foreground">
                  {JSON.stringify(filterData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFilter}>
                <Save className="h-4 w-4 mr-2" />
                {editingFilter ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtros guardados */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Filtros Guardados</h3>
          <Button variant="outline" size="sm" onClick={handleSaveCurrentAsFilter}>
            <Plus className="h-4 w-4 mr-2" />
            Guardar Actual
          </Button>
        </div>

        {customFilters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tienes filtros personalizados guardados</p>
            <p className="text-sm">Guarda la configuración actual para reutilizarla</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {customFilters.map((filter) => (
              <Card key={filter.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{filter.name}</h4>
                      {filter.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Por defecto
                        </Badge>
                      )}
                    </div>
                    {filter.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {filter.description}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {Object.entries(filter.filters).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null
                        return (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {Array.isArray(value) ? value.join(', ') : value}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApplyFilter(filter)}
                    >
                      Aplicar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEditFilter(filter)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteFilterId(filter.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Presets */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Filtros Predefinidos</h3>
          <div className="grid gap-2">
            {FILTER_PRESETS.map((preset) => (
              <Card key={preset.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{preset.icon}</span>
                    <div>
                      <h4 className="font-medium text-sm">{preset.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    Aplicar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteFilterId} onOpenChange={() => setDeleteFilterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar filtro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El filtro será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFilterId && handleDeleteFilter(deleteFilterId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
