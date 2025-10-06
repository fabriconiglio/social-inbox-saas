"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { createSLA, deleteSLA } from "@/app/actions/sla"
import { useRouter } from "next/navigation"
import type { SLA } from "@prisma/client"

interface SLASettingsProps {
  tenantId: string
  slas: SLA[]
}

export function SLASettings({ tenantId, slas }: SLASettingsProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [firstResponseMins, setFirstResponseMins] = useState("60")

  async function handleCreate() {
    setCreating(true)
    const formData = new FormData()
    formData.append("tenantId", tenantId)
    formData.append("name", name)
    formData.append("firstResponseMins", firstResponseMins)

    const result = await createSLA(formData)

    if (result.success) {
      setName("")
      setFirstResponseMins("60")
      router.refresh()
    } else {
      alert(result.error)
    }

    setCreating(false)
  }

  async function handleDelete(slaId: string) {
    if (!confirm("¿Estás seguro de eliminar este SLA?")) return

    const formData = new FormData()
    formData.append("slaId", slaId)

    await deleteSLA(formData)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear nuevo SLA</CardTitle>
          <CardDescription>Define un nuevo acuerdo de nivel de servicio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" placeholder="SLA Estándar" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstResponseMins">Primera respuesta (minutos)</Label>
              <Input
                id="firstResponseMins"
                type="number"
                placeholder="60"
                value={firstResponseMins}
                onChange={(e) => setFirstResponseMins(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!name || !firstResponseMins || creating}>
            <Plus className="mr-2 h-4 w-4" />
            Crear SLA
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SLAs configurados</CardTitle>
          <CardDescription>Gestiona los SLAs existentes</CardDescription>
        </CardHeader>
        <CardContent>
          {slas.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No hay SLAs configurados</p>
          ) : (
            <div className="space-y-4">
              {slas.map((sla) => (
                <div key={sla.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">{sla.name}</h4>
                    <p className="text-sm text-muted-foreground">Primera respuesta: {sla.firstResponseMins} minutos</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(sla.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
