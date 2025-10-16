"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Eye,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Info,
  File as FileIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentPreviewProps {
  src: string
  name: string
  size: number
  type: string
  onRemove?: () => void
  onDownload?: () => void
  className?: string
  showMetadata?: boolean
  showControls?: boolean
  maxWidth?: number
  maxHeight?: number
}

interface DocumentMetadata {
  pages?: number
  author?: string
  title?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
  fileSize: string
  format: string
  dimensions?: string
}

export function DocumentPreview({
  src,
  name,
  size,
  type,
  onRemove,
  onDownload,
  className,
  showMetadata = true,
  showControls = true,
  maxWidth = 400,
  maxHeight = 500,
}: DocumentPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (type.includes('word') || type.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    if (type.includes('presentation') || type.includes('powerpoint')) return <FileImage className="h-8 w-8 text-orange-500" />
    return <FileIcon className="h-8 w-8 text-gray-500" />
  }

  const getDocumentType = (type: string): string => {
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('word') || type.includes('document')) return 'Word'
    if (type.includes('sheet') || type.includes('excel')) return 'Excel'
    if (type.includes('presentation') || type.includes('powerpoint')) return 'PowerPoint'
    return 'Documento'
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setZoom(1)
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      const link = document.createElement('a')
      link.href = src
      link.download = name
      link.click()
    }
  }

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handleIframeLoad = () => {
    setLoading(false)
    setError(false)
    
    // Extraer metadatos básicos
    setMetadata({
      fileSize: formatFileSize(size),
      format: getDocumentType(type),
      pages: totalPages || 1
    })
  }

  const handleIframeError = () => {
    setLoading(false)
    setError(true)
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25",
        className
      )}>
        <div className="text-center p-4">
          {getDocumentIcon(type)}
          <p className="text-sm text-muted-foreground mt-2">Error al cargar documento</p>
          <p className="text-xs text-muted-foreground mt-1">{name}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Contenedor principal */}
      <div className={cn(
        "relative overflow-hidden rounded-lg border bg-background",
        isFullscreen && "fixed inset-0 z-50 bg-white"
      )}>
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Documento */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            loading && "opacity-0"
          )}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            maxWidth: isFullscreen ? 'none' : `${maxWidth}px`,
            maxHeight: isFullscreen ? 'none' : `${maxHeight}px`,
            width: isFullscreen ? '100%' : 'auto',
            height: isFullscreen ? '100%' : 'auto',
          }}
        >
          {type.includes('pdf') ? (
            <iframe
              ref={iframeRef}
              src={`${src}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted">
              <div className="text-center">
                {getDocumentIcon(type)}
                <p className="text-sm font-medium mt-2">{getDocumentType(type)}</p>
                <p className="text-xs text-muted-foreground">{name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="mt-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Overlay con controles */}
        {showControls && (
          <div className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200",
            isFullscreen && "bg-black/10"
          )}>
            {/* Controles superiores */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Info className="h-4 w-4" />
              </Button>
              {onRemove && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Controles inferiores */}
            <div className="absolute bottom-2 left-2 right-2 space-y-2">
              {/* Controles de zoom */}
              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0"
                  disabled={zoom <= 0.25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetZoom}
                  className="h-8 px-3"
                >
                  {Math.round(zoom * 100)}%
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Controles de navegación y acción */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {type.includes('pdf') && totalPages > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleFullscreen}
                    className="h-8 w-8 p-0"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de zoom */}
        {zoom !== 1 && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {Math.round(zoom * 100)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Panel de información */}
      {showInfo && metadata && (
        <div className="absolute top-12 right-2 bg-black/80 text-white p-3 rounded-lg text-xs space-y-1 min-w-48">
          <div className="font-medium">{name}</div>
          <div>Tipo: {metadata.format}</div>
          <div>Tamaño: {metadata.fileSize}</div>
          {metadata.pages && <div>Páginas: {metadata.pages}</div>}
          {metadata.author && <div>Autor: {metadata.author}</div>}
          {metadata.title && <div>Título: {metadata.title}</div>}
          {metadata.creationDate && <div>Creado: {metadata.creationDate}</div>}
        </div>
      )}

      {/* Metadatos */}
      {showMetadata && metadata && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{name}</span>
            <span>{metadata.fileSize}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {metadata.format}
            </Badge>
            {metadata.pages && <span>{metadata.pages} páginas</span>}
            {metadata.author && <span>por {metadata.author}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para galería de documentos
interface DocumentGalleryProps {
  documents: Array<{
    id: string
    src: string
    name: string
    size: number
    type: string
    thumbnail?: string
  }>
  onRemove?: (id: string) => void
  onDownload?: (id: string) => void
  className?: string
  maxDocuments?: number
}

export function DocumentGallery({ 
  documents, 
  onRemove, 
  onDownload, 
  className,
  maxDocuments = 6 
}: DocumentGalleryProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const visibleDocuments = documents.slice(0, maxDocuments)
  const remainingCount = documents.length - maxDocuments

  const handleDocumentClick = (index: number) => {
    setSelectedDocument(documents[index].src)
    setCurrentIndex(index)
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % documents.length
    setCurrentIndex(nextIndex)
    setSelectedDocument(documents[nextIndex].src)
  }

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + documents.length) % documents.length
    setCurrentIndex(prevIndex)
    setSelectedDocument(documents[prevIndex].src)
  }

  const handleClose = () => {
    setSelectedDocument(null)
  }

  const getDocumentIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
    if (type.includes('word') || type.includes('document')) return <FileText className="h-6 w-6 text-blue-500" />
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="h-6 w-6 text-green-500" />
    if (type.includes('presentation') || type.includes('powerpoint')) return <FileImage className="h-6 w-6 text-orange-500" />
    return <FileIcon className="h-6 w-6 text-gray-500" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Grid de documentos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {visibleDocuments.map((document, index) => (
          <div
            key={document.id}
            className="relative aspect-square cursor-pointer group"
            onClick={() => handleDocumentClick(index)}
          >
            <div className="w-full h-full bg-muted rounded-lg border flex flex-col items-center justify-center p-2">
              {getDocumentIcon(document.type)}
              <p className="text-xs font-medium text-center mt-1 truncate w-full">
                {document.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(document.size)}
              </p>
            </div>
            
            {/* Overlay con botón de vista */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded-full p-2">
                  <Eye className="h-4 w-4 text-black" />
                </div>
              </div>
            </div>
            
            {/* Botón de remover */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove?.(document.id)
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Indicador de más documentos */}
        {remainingCount > 0 && (
          <div className="aspect-square flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25">
            <div className="text-center">
              <FileIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">+{remainingCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de documento seleccionado */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <DocumentPreview
              src={selectedDocument}
              name={documents[currentIndex]?.name}
              size={documents[currentIndex]?.size || 0}
              type={documents[currentIndex]?.type || 'application/pdf'}
              showControls={true}
              showMetadata={false}
              className="w-full h-full"
            />
            
            {/* Controles de navegación */}
            {documents.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                >
                  ←
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  →
                </Button>
              </>
            )}
            
            {/* Botón de cerrar */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClose}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Información */}
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm font-medium">{documents[currentIndex]?.name}</p>
              <p className="text-xs opacity-75">
                {currentIndex + 1} de {documents.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
