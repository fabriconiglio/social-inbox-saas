"use client"

import { useState } from "react"
import { Download, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getPdfUrlWithParams, PDF_CONFIG } from "@/lib/pdf-config-simple"

interface PdfViewerSimpleProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  fileName?: string
}

export function PdfViewerSimple({ isOpen, onClose, pdfUrl, fileName }: PdfViewerSimpleProps) {
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = fileName || "documento.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {fileName || "Visualizador de PDF"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <iframe
            src={getPdfUrlWithParams(pdfUrl)}
            className={`w-full h-full border-0`}
            style={{ minHeight: PDF_CONFIG.simpleViewer.minHeight }}
            title={fileName || "PDF Viewer"}
            onError={() => {
              console.warn('Error cargando PDF en iframe, usando fallback')
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PdfAttachmentSimpleProps {
  url: string
  fileName: string
  className?: string
  onOpenModal?: () => void
}

export function PdfAttachmentSimple({ 
  url, 
  fileName, 
  className,
  onOpenModal 
}: PdfAttachmentSimpleProps) {
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`flex items-start gap-3 p-3 border rounded-lg bg-muted/50 ${className}`}>
      {/* Icono del PDF */}
      <div className="flex-shrink-0">
        <FileText className="h-8 w-8 text-red-500" />
      </div>

      {/* Información del archivo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <p className="text-xs text-muted-foreground">PDF • Documento</p>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-1">
        {onOpenModal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenModal}
            className="h-8 w-8 p-0"
            title="Ver PDF completo"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-8 w-8 p-0"
          title="Descargar PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
