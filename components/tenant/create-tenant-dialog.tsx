"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTenant } from "@/app/actions/tenant"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function CreateTenantDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")

    const result = await createTenant(formData)

    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to create tenant")
      setLoading(false)
    } else if (result?.success && result.tenantId) {
      setOpen(false)
      router.push(`/app/${result.tenantId}/inbox`)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear nueva empresa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear nueva empresa</DialogTitle>
            <DialogDescription>Crea una nueva empresa y su primer local</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la empresa</Label>
              <Input id="name" name="name" placeholder="Mi Empresa SA" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingEmail">Email de facturación</Label>
              <Input
                id="billingEmail"
                name="billingEmail"
                type="email"
                placeholder="facturacion@empresa.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localName">Nombre del primer local</Label>
              <Input id="localName" name="localName" placeholder="Local Centro" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localAddress">Dirección (opcional)</Label>
              <Input id="localAddress" name="localAddress" placeholder="Av. Principal 123" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
