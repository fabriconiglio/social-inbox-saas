"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteCannedResponse } from "@/app/actions/canned-responses"
import { toast } from "sonner"
import type { CannedResponse } from "@prisma/client"

interface DeleteQuickReplyDialogProps {
  tenantId: string
  response: CannedResponse
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteQuickReplyDialog({
  tenantId,
  response,
  open,
  onOpenChange,
}: DeleteQuickReplyDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const result = await deleteCannedResponse(tenantId, response.id)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Respuesta rápida eliminada exitosamente")
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Error al eliminar respuesta rápida")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar respuesta rápida?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la respuesta rápida
            &quot;{response.title}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

