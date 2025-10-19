"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CalendarIcon, Clock, TrendingUp, BarChart3 } from "lucide-react"
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DateRange {
  label: string
  value: string
  startDate: Date
  endDate: Date
  icon?: React.ComponentType<{ className?: string }>
}

interface DateRangeSelectorProps {
  startDate: Date
  endDate: Date
  onDateRangeChange: (startDate: Date, endDate: Date) => void
  className?: string
}

export function DateRangeSelector({
  startDate,
  endDate,
  onDateRangeChange,
  className
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<string>("custom")
  const [tempStartDate, setTempStartDate] = useState<Date>(startDate)
  const [tempEndDate, setTempEndDate] = useState<Date>(endDate)

  // Rangos predefinidos
  const predefinedRanges: DateRange[] = [
    {
      label: "Últimos 7 días",
      value: "last7days",
      startDate: subDays(new Date(), 6),
      endDate: new Date(),
      icon: Clock
    },
    {
      label: "Últimos 14 días",
      value: "last14days",
      startDate: subDays(new Date(), 13),
      endDate: new Date(),
      icon: Clock
    },
    {
      label: "Últimos 30 días",
      value: "last30days",
      startDate: subDays(new Date(), 29),
      endDate: new Date(),
      icon: CalendarIcon
    },
    {
      label: "Últimos 90 días",
      value: "last90days",
      startDate: subDays(new Date(), 89),
      endDate: new Date(),
      icon: CalendarIcon
    },
    {
      label: "Esta semana",
      value: "thisWeek",
      startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
      icon: TrendingUp
    },
    {
      label: "Semana pasada",
      value: "lastWeek",
      startDate: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      endDate: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      icon: TrendingUp
    },
    {
      label: "Este mes",
      value: "thisMonth",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      icon: BarChart3
    },
    {
      label: "Mes pasado",
      value: "lastMonth",
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfMonth(subMonths(new Date(), 1)),
      icon: BarChart3
    },
    {
      label: "Últimos 3 meses",
      value: "last3Months",
      startDate: subMonths(new Date(), 2),
      endDate: new Date(),
      icon: CalendarIcon
    },
    {
      label: "Este año",
      value: "thisYear",
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date()),
      icon: CalendarIcon
    }
  ]

  const handleRangeSelect = (rangeValue: string) => {
    setSelectedRange(rangeValue)
    
    if (rangeValue === "custom") {
      return
    }

    const selectedRangeData = predefinedRanges.find(range => range.value === rangeValue)
    if (selectedRangeData) {
      setTempStartDate(selectedRangeData.startDate)
      setTempEndDate(selectedRangeData.endDate)
      onDateRangeChange(selectedRangeData.startDate, selectedRangeData.endDate)
      setIsOpen(false)
    }
  }

  const handleCustomDateChange = () => {
    onDateRangeChange(tempStartDate, tempEndDate)
    setIsOpen(false)
  }

  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, "dd/MM/yyyy", { locale: es })} - ${format(end, "dd/MM/yyyy", { locale: es })}`
  }

  const getCurrentRangeLabel = () => {
    const currentRange = predefinedRanges.find(range => 
      range.startDate.getTime() === startDate.getTime() && 
      range.endDate.getTime() === endDate.getTime()
    )
    return currentRange ? currentRange.label : "Rango personalizado"
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !startDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getCurrentRangeLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Seleccionar rango de fechas</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Elige un rango predefinido o selecciona fechas personalizadas
              </p>
            </div>

            <RadioGroup value={selectedRange} onValueChange={handleRangeSelect}>
              <div className="space-y-2">
                {predefinedRanges.map((range) => {
                  const IconComponent = range.icon
                  return (
                    <div key={range.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={range.value} id={range.value} />
                      <Label 
                        htmlFor={range.value} 
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                      >
                        {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm">{range.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDateRange(range.startDate, range.endDate)}
                        </span>
                      </Label>
                    </div>
                  )
                })}
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Rango personalizado</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {selectedRange === "custom" && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium">Fecha de inicio</Label>
                  <Calendar
                    mode="single"
                    selected={tempStartDate}
                    onSelect={(date) => date && setTempStartDate(date)}
                    className="rounded-md border"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Fecha de fin</Label>
                  <Calendar
                    mode="single"
                    selected={tempEndDate}
                    onSelect={(date) => date && setTempEndDate(date)}
                    className="rounded-md border"
                  />
                </div>

                <Button 
                  onClick={handleCustomDateChange}
                  className="w-full"
                  disabled={!tempStartDate || !tempEndDate || tempStartDate > tempEndDate}
                >
                  Aplicar rango personalizado
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
