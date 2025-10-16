"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Info,
  Image as ImageIcon,
  FileImage
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ImagePreviewProps {
  src: string
  alt: string
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

interface ImageMetadata {
  width: number
  height: number
  aspectRatio: string
  fileSize: string
  format: string
  dimensions: string
}

export function ImagePreview({
  src,
  alt,
  name,
  size,
  type,
  onRemove,
  onDownload,
  className,
  showMetadata = true,
  showControls = true,
  maxWidth = 300,
  maxHeight = 200,
}: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // Extraer metadatos de la imagen
  const extractMetadata = (img: HTMLImageElement) => {
    const aspectRatio = (img.naturalWidth / img.naturalHeight).toFixed(2)
    const format = type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
    
    setMetadata({
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio,
      fileSize: formatFileSize(size),
      format,
      dimensions: `${img.naturalWidth} × ${img.naturalHeight}`
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoading(false)
    setError(false)
    extractMetadata(e.currentTarget)
  }

  const handleImageError = () => {
    setLoading(false)
    setError(true)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setZoom(1)
    setRotation(0)
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

  const resetTransform = () => {
    setZoom(1)
    setRotation(0)
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25",
        className
      )}>
        <div className="text-center p-4">
          <FileImage className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Error al cargar imagen</p>
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
        isFullscreen && "fixed inset-0 z-50 bg-black"
      )}>
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Imagen */}
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={cn(
            "transition-all duration-300 ease-in-out",
            loading && "opacity-0",
            !isFullscreen && "max-w-full h-auto"
          )}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            maxWidth: isFullscreen ? 'none' : `${maxWidth}px`,
            maxHeight: isFullscreen ? 'none' : `${maxHeight}px`,
            width: isFullscreen ? '100%' : 'auto',
            height: isFullscreen ? '100%' : 'auto',
            objectFit: isFullscreen ? 'contain' : 'cover'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Overlay con controles */}
        {showControls && (
          <div className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200",
            isFullscreen && "bg-black/20"
          )}>
            <div className="absolute top-2 right-2 flex gap-1">
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

            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
              {/* Controles de zoom y rotación */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRotate}
                  className="h-8 w-8 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetTransform}
                  className="h-8 w-8 p-0"
                >
                  Reset
                </Button>
              </div>

              {/* Controles de pantalla completa y descarga */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFullscreen}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
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
            <span>{metadata.dimensions}</span>
            <span>Aspect: {metadata.aspectRatio}</span>
          </div>
        </div>
      )}

      {/* Modal de pantalla completa */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
            
            {/* Controles en pantalla completa */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetTransform}
              >
                Reset
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFullscreen}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Información en pantalla completa */}
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs opacity-75">{metadata?.dimensions} • {metadata?.fileSize}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para galería de imágenes
interface ImageGalleryProps {
  images: Array<{
    id: string
    src: string
    name: string
    size: number
    type: string
  }>
  onRemove?: (id: string) => void
  onDownload?: (id: string) => void
  className?: string
  maxImages?: number
}

export function ImageGallery({ 
  images, 
  onRemove, 
  onDownload, 
  className,
  maxImages = 6 
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const visibleImages = images.slice(0, maxImages)
  const remainingCount = images.length - maxImages

  const handleImageClick = (index: number) => {
    setSelectedImage(images[index].src)
    setCurrentIndex(index)
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length
    setCurrentIndex(nextIndex)
    setSelectedImage(images[nextIndex].src)
  }

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length
    setCurrentIndex(prevIndex)
    setSelectedImage(images[prevIndex].src)
  }

  const handleClose = () => {
    setSelectedImage(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {visibleImages.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square cursor-pointer group"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={image.src}
              alt={image.name}
              className="w-full h-full object-cover rounded-lg border"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg" />
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove?.(image.id)
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Indicador de más imágenes */}
        {remainingCount > 0 && (
          <div className="aspect-square flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25">
            <div className="text-center">
              <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">+{remainingCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de imagen seleccionada */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt={images[currentIndex]?.name}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Controles de navegación */}
            {images.length > 1 && (
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
              <p className="text-sm font-medium">{images[currentIndex]?.name}</p>
              <p className="text-xs opacity-75">
                {currentIndex + 1} de {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
