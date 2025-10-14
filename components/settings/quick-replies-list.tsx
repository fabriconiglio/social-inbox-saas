"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditQuickReplyDialog } from "@/components/settings/edit-quick-reply-dialog"
import { DeleteQuickReplyDialog } from "@/components/settings/delete-quick-reply-dialog"
import { Edit, Trash2, FileText } from "lucide-react"
import type { CannedResponse } from "@prisma/client"

interface QuickRepliesListProps {
  tenantId: string
  responses: Array<{
    id: string
    title: string
    content: string
    variablesJSON: any
    createdAt: Date
    updatedAt: Date
  }>
}

export function QuickRepliesList({ tenantId, responses }: QuickRepliesListProps) {
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null)
  const [deletingResponse, setDeletingResponse] = useState<CannedResponse | null>(null)

  if (responses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay respuestas rápidas</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea tu primera respuesta rápida para agilizar la atención
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {responses.map((response) => (
          <Card key={response.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{response.title}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {response.content}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {response.variablesJSON && Object.keys(response.variablesJSON).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(response.variablesJSON).length} variable(s)
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingResponse(response as CannedResponse)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingResponse(response as CannedResponse)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingResponse && (
        <EditQuickReplyDialog
          tenantId={tenantId}
          response={editingResponse}
          open={!!editingResponse}
          onOpenChange={(open) => !open && setEditingResponse(null)}
        />
      )}

      {deletingResponse && (
        <DeleteQuickReplyDialog
          tenantId={tenantId}
          response={deletingResponse}
          open={!!deletingResponse}
          onOpenChange={(open) => !open && setDeletingResponse(null)}
        />
      )}
    </>
  )
}

