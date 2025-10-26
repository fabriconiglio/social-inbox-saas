"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatePickerWithRange } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Clock,
  X,
  ChevronDown
} from "lucide-react"
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

interface AuditLogDateFiltersProps {
  onDateRangeChange: (range: DateRange | undefined) => void
  selectedRange?: DateRange
  className?: string
}

const PRESET_RANGES = [
  {
    label: "Últimas 24 horas",
    value: "24h",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(new Date())
    })
  },
  {
    label: "Últimos 7 días",
    value: "7d",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 7)),
      to: endOfDay(new Date())
    })
  },
  {
    label: "Últimos 30 días",
    value: "30d",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date())
    })
  },
  {
    label: "Últimos 90 días",
    value: "90d",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 90)),
      to: endOfDay(new Date())
    })
  },
  {
    label: "Este mes",
    value: "month",
    getRange: () => ({
      from: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      to: endOfDay(new Date())
    })
  },
  {
    label: "Mes pasado",
    value: "lastMonth",
    getRange: () => {
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      const lastDayOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
      return {
        from: startOfDay(lastMonth),
        to: endOfDay(lastDayOfLastMonth)
      }
    }
  }
]

export function AuditLogDateFilters({ 
  onDateRangeChange, 
  selectedRange,
  className 
}: AuditLogDateFiltersProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [customRange, setCustomRange] = useState<DateRange | undefined>(selectedRange)
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const handlePresetSelect = (presetValue: string) => {
    if (presetValue === "custom") {
      setShowCustomPicker(true)
      setSelectedPreset("custom")
      return
    }

    const preset = PRESET_RANGES.find(p => p.value === presetValue)
    if (preset) {
      const range = preset.getRange()
      setCustomRange(range)
      onDateRangeChange(range)
      setSelectedPreset(presetValue)
      setShowCustomPicker(false)
    }
  }

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setCustomRange(range)
    onDateRangeChange(range)
    if (range) {
      setSelectedPreset("custom")
    }
  }

  const handleClear = () => {
    setCustomRange(undefined)
    onDateRangeChange(undefined)
    setSelectedPreset("")
    setShowCustomPicker(false)
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return "Sin fecha"
    
    const fromStr = format(range.from, "dd/MM/yyyy", { locale: es })
    const toStr = range.to ? format(range.to, "dd/MM/yyyy", { locale: es }) : fromStr
    
    return `${fromStr} - ${toStr}`
  }

  const isPresetSelected = (presetValue: string) => {
    if (presetValue === "custom") return selectedPreset === "custom"
    
    const preset = PRESET_RANGES.find(p => p.value === presetValue)
    if (!preset || !customRange) return false
    
    const presetRange = preset.getRange()
    return (
      customRange.from?.getTime() === presetRange.from.getTime() &&
      customRange.to?.getTime() === presetRange.to.getTime()
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label>Rango de Fechas</Label>
        
        {/* Rangos predefinidos */}
        <RadioGroup value={selectedPreset} onValueChange={handlePresetSelect}>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_RANGES.map((preset) => (
              <div key={preset.value} className="flex items-center space-x-2">
                <RadioGroupItem value={preset.value} id={preset.value} />
                <Label 
                  htmlFor={preset.value} 
                  className="text-sm cursor-pointer flex-1"
                >
                  {preset.label}
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="text-sm cursor-pointer flex-1">
                Rango personalizado
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Selector de fecha personalizado */}
      {showCustomPicker && (
        <div className="space-y-2">
          <Label>Seleccionar fechas</Label>
          <DatePickerWithRange
            date={customRange}
            onDateChange={handleCustomRangeChange}
            placeholder="Seleccionar rango de fechas"
          />
        </div>
      )}

      {/* Rango seleccionado */}
      {customRange && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Calendar className="h-4 w-4" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {formatDateRange(customRange)}
            </p>
            {selectedPreset && selectedPreset !== "custom" && (
              <p className="text-xs text-muted-foreground">
                {PRESET_RANGES.find(p => p.value === selectedPreset)?.label}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePresetSelect("7d")}
          className="text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          7 días
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePresetSelect("30d")}
          className="text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          30 días
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Limpiar
        </Button>
      </div>
    </div>
  )
}
