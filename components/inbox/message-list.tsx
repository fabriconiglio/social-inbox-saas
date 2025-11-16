"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { PdfAttachmentSimple, PdfViewerSimple } from "./pdf-viewer-simple"
import { TextHighlight } from "@/components/ui/text-highlight"
import { useAdvancedFilters } from "@/hooks/use-advanced-filters"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle } from "lucide-react"

interface MessageListProps {
  threadId: string
  tenantId: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function MessageList({ threadId, tenantId }: MessageListProps) {
  const { data: messages, error } = useSWR(`/api/tenants/${tenantId}/threads/${threadId}/messages`, fetcher, {
    refreshInterval: 3000, // Poll every 3 seconds for new messages
  })

  const { filters } = useAdvancedFilters(tenantId)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; fileName: string } | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleOpenPdfModal = (url: string, fileName: string) => {
    setSelectedPdf({ url, fileName })
    setPdfModalOpen(true)
  }

  const handleClosePdfModal = () => {
    setPdfModalOpen(false)
    setSelectedPdf(null)
  }

  if (error) {
    return <div className="flex flex-1 items-center justify-center text-destructive">Error al cargar los mensajes</div>
  }

  if (!messages) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Cargando mensajes...</div>
  }

  return (
    <div className="flex-1 space-y-4 overflow-auto p-4">
      {messages.map((message: any) => {
        const isOutbound = message.direction === "OUTBOUND"

        return (
          <div key={message.id} className={cn("flex gap-3", isOutbound && "flex-row-reverse")}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.author?.image || undefined} />
              <AvatarFallback>
                {isOutbound
                  ? message.author?.name?.[0]?.toUpperCase() || "A"
                  : message.contact?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className={cn("flex max-w-[70%] flex-col gap-1", isOutbound && "items-end")}>
              <div className={cn("rounded-lg p-3", isOutbound ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p className="text-sm">
                  <TextHighlight
                    text={message.body}
                    searchTerm={filters.q || ""}
                    highlightClassName={isOutbound ? "bg-yellow-300 dark:bg-yellow-600" : "bg-yellow-200 dark:bg-yellow-800"}
                  />
                </p>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((att: any, idx: number) => {
                      const isPdf = att.filename?.toLowerCase().endsWith('.pdf') || att.type === 'pdf'
                      const fileName = att.filename || "Archivo adjunto"
                      
                      return (
                        <div key={idx}>
                          {att.type === "image" && (
                            <img src={att.url || "/placeholder.svg"} alt="Attachment" className="max-h-64 rounded" />
                          )}
                          {isPdf && (
                            <PdfAttachmentSimple
                              url={att.url}
                              fileName={fileName}
                              onOpenModal={() => handleOpenPdfModal(att.url, fileName)}
                            />
                          )}
                          {att.type === "file" && !isPdf && (
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline">
                              {fileName}
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true, locale: es })}
                </span>
                {message.failedReason && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 text-xs text-destructive cursor-help">
                          <AlertCircle className="h-3 w-3" />
                          Falló
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{message.failedReason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
      
      {/* Modal del PDF Viewer */}
      {selectedPdf && (
        <PdfViewerSimple
          isOpen={pdfModalOpen}
          onClose={handleClosePdfModal}
          pdfUrl={selectedPdf.url}
          fileName={selectedPdf.fileName}
        />
      )}
    </div>
  )
}
