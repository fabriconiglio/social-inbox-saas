"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { listCannedResponses } from "@/app/actions/canned-responses"
import { Search, FileText } from "lucide-react"
import { useEffect } from "react"

interface QuickRepliesPopoverProps {
  tenantId: string
  children: React.ReactNode
  onSelect: (content: string) => void
}

export function QuickRepliesPopover({ tenantId, children, onSelect }: QuickRepliesPopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [responses, setResponses] = useState<Array<{
    id: string
    title: string
    content: string
  }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadResponses()
    }
  }, [open])

  async function loadResponses() {
    setLoading(true)
    try {
      const result = await listCannedResponses(tenantId)
      if (result.success && result.data) {
        setResponses(result.data)
      }
    } catch (error) {
      console.error("Error loading responses:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredResponses = responses.filter((response) =>
    response.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleSelect(content: string) {
    onSelect(content)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar respuesta rápida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Cargando...</div>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? "No se encontraron respuestas" : "No hay respuestas rápidas"}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredResponses.map((response) => (
                <button
                  key={response.id}
                  onClick={() => handleSelect(response.content)}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="font-medium text-sm">{response.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {response.content}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

