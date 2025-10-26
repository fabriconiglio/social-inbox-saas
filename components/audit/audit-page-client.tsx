"use client"

import { useState } from "react"
import { AuditLogAdvancedFilters } from "@/components/audit/audit-log-advanced-filters"
import { AuditLogHistory } from "@/components/audit/audit-log-history"
import { AuditLogExport } from "@/components/audit/audit-log-export"
import type { AuditLogFilters } from "@/components/audit/audit-log-advanced-filters"

interface AuditPageClientProps {
  tenantId: string
  initialFilters: {
    entity?: string
    entityId?: string
    action?: string
    actor?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
  }
}

export function AuditPageClient({ tenantId, initialFilters }: AuditPageClientProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    entity: initialFilters.entity || "all",
    action: initialFilters.action || "all",
    actor: initialFilters.actor || "",
    entityId: initialFilters.entityId || "",
    dateFrom: initialFilters.dateFrom,
    dateTo: initialFilters.dateTo,
    limit: initialFilters.limit || 50,
    includeDetails: true,
    includeDiffs: false
  })

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters)
    // Aquí se podría implementar la lógica de filtrado en tiempo real
    console.log("Filtros aplicados:", newFilters)
  }

  const handleExport = () => {
    // Lógica de exportación
    console.log("Exportando audit log con filtros:", filters)
  }

  const handleClear = () => {
    setFilters({
      entity: "all",
      action: "all",
      actor: "",
      entityId: "",
      dateFrom: undefined,
      dateTo: undefined,
      limit: 50,
      includeDetails: true,
      includeDiffs: false
    })
  }

  return (
    <div className="space-y-6">
      {/* Filtros Avanzados */}
      <AuditLogAdvancedFilters
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        onClear={handleClear}
        initialFilters={filters}
      />

      {/* Exportación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Historial de Auditoría */}
          <AuditLogHistory
            tenantId={tenantId}
            entity={filters.entity || "all"}
            entityId={filters.entityId || "all"}
            limit={filters.limit || 50}
            showFilters={true}
          />
        </div>
        
        <div>
          {/* Panel de Exportación */}
          <AuditLogExport
            tenantId={tenantId}
            filters={{
              entity: filters.entity || "all",
              action: filters.action || "all",
              actor: filters.actor || "",
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo
            }}
          />
        </div>
      </div>
    </div>
  )
}
