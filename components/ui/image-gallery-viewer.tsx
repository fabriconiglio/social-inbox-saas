"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Info,
  Filter,
  Grid,
  List,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Share,
  Heart,
  Bookmark,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageGalleryViewerProps {
  images: Array<{
    id: string
    src: string
    name: string
    size: number
    type: string
    thumbnail?: string
    metadata?: {
      width: number
      height: number
      format: string
      fileSize: string
      createdAt?: string
      camera?: {
        make?: string
        model?: string
        settings?: string
      }
    }
  }>
  initialIndex?: number
  onClose?: () => void
  onDownload?: (imageId: string) => void
  onShare?: (imageId: string) => void
  onFavorite?: (imageId: string) => void
  onBookmark?: (imageId: string) => void
  className?: string
  showMetadata?: boolean
  showControls?: boolean
  allowFullscreen?: boolean
  allowDownload?: boolean
  allowShare?: boolean
  allowFavorites?: boolean
  allowBookmarks?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

interface ImageFilters {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  blur: number
  sepia: number
  grayscale: number
  invert: number
}

export function ImageGalleryViewer({
  images,
  initialIndex = 0,
  onClose,
  onDownload,
  onShare,
  onFavorite,
  onBookmark,
  className,
  showMetadata = true,
  showControls = true,
  allowFullscreen = true,
  allowDownload = true,
  allowShare = true,
  allowFavorites = true,
  allowBookmarks = true,
  autoPlay = false,
  autoPlayInterval = 3000,
}: ImageGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [showMetadataPanel, setShowMetadataPanel] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0
  })
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  const currentImage = images[currentIndex]

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }, autoPlayInterval)
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, images.length, autoPlayInterval])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showControls) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'Escape':
          e.preventDefault()
          onClose?.()
          break
        case ' ':
          e.preventDefault()
          setIsAutoPlaying(!isAutoPlaying)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          if (allowFullscreen) {
            handleFullscreen()
          }
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case '0':
          e.preventDefault()
          handleResetZoom()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          handleRotate()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showControls, isAutoPlaying, allowFullscreen])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    resetView()
  }, [images.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    resetView()
  }, [images.length])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1))
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }, [])

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!allowFullscreen) return
    
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [allowFullscreen])

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(currentImage.id)
    } else {
      const link = document.createElement('a')
      link.href = currentImage.src
      link.download = currentImage.name
      link.click()
    }
  }, [currentImage, onDownload])

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(currentImage.id)
    } else if (navigator.share) {
      navigator.share({
        title: currentImage.name,
        url: currentImage.src
      })
    }
  }, [currentImage, onShare])

  const handleFavorite = useCallback(() => {
    if (!allowFavorites) return
    
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(currentImage.id)) {
        newFavorites.delete(currentImage.id)
      } else {
        newFavorites.add(currentImage.id)
      }
      return newFavorites
    })
    
    onFavorite?.(currentImage.id)
  }, [currentImage.id, allowFavorites, onFavorite])

  const handleBookmark = useCallback(() => {
    if (!allowBookmarks) return
    
    setBookmarks((prev) => {
      const newBookmarks = new Set(prev)
      if (newBookmarks.has(currentImage.id)) {
        newBookmarks.delete(currentImage.id)
      } else {
        newBookmarks.add(currentImage.id)
      }
      return newBookmarks
    })
    
    onBookmark?.(currentImage.id)
  }, [currentImage.id, allowBookmarks, onBookmark])

  const resetView = useCallback(() => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
    setRotation(0)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return
    
    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }, [zoom, panX, panY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }, [isDragging, dragStart, zoom])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }, [handleZoomIn, handleZoomOut])

  const getFilterStyle = () => {
    const { brightness, contrast, saturation, hue, blur, sepia, grayscale, invert } = filters
    return {
      filter: `
        brightness(${brightness}%) 
        contrast(${contrast}%) 
        saturate(${saturation}%) 
        hue-rotate(${hue}deg) 
        blur(${blur}px) 
        sepia(${sepia}%) 
        grayscale(${grayscale}%) 
        invert(${invert}%)
      `.replace(/\s+/g, ' ').trim()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!currentImage) return null

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 bg-black flex flex-col",
        isFullscreen && "bg-black",
        className
      )}
    >
      {/* Header */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-black/50 text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold truncate max-w-xs">
              {currentImage.name}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {currentIndex + 1} de {images.length}
            </Badge>
            {currentImage.metadata && (
              <Badge variant="outline" className="text-xs">
                {currentImage.metadata.width}×{currentImage.metadata.height}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Auto-play controls */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="text-white hover:bg-white/20"
              >
                {isAutoPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* View mode */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="text-white hover:bg-white/20"
            >
              {viewMode === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid className="h-4 w-4" />
              )}
            </Button>
            
            {/* Thumbnails toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="text-white hover:bg-white/20"
            >
              <Grid className="h-4 w-4" />
            </Button>
            
            {/* Metadata toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadataPanel(!showMetadataPanel)}
              className="text-white hover:bg-white/20"
            >
              <Info className="h-4 w-4" />
            </Button>
            
            {/* Filters toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-white hover:bg-white/20"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            {/* Fullscreen */}
            {allowFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex relative">
        {/* Image container */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <img
            ref={imageRef}
            src={currentImage.src}
            alt={currentImage.name}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${panX}px, ${panY}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              ...getFilterStyle()
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            draggable={false}
          />
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnails sidebar */}
        {showThumbnails && (
          <div className="w-32 bg-black/50 p-2 overflow-y-auto">
            <div className="space-y-2">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative cursor-pointer rounded overflow-hidden border-2 transition-all",
                    index === currentIndex 
                      ? "border-white" 
                      : "border-transparent hover:border-white/50"
                  )}
                  onClick={() => {
                    setCurrentIndex(index)
                    resetView()
                  }}
                >
                  <img
                    src={image.thumbnail || image.src}
                    alt={image.name}
                    className="w-full h-20 object-cover"
                  />
                  {favorites.has(image.id) && (
                    <div className="absolute top-1 right-1">
                      <Heart className="h-3 w-3 text-red-500 fill-current" />
                    </div>
                  )}
                  {bookmarks.has(image.id) && (
                    <div className="absolute top-1 left-1">
                      <Bookmark className="h-3 w-3 text-blue-500 fill-current" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-black/50 text-white">
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.1}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="text-white hover:bg-white/20"
            >
              Reset
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons */}
            {allowDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            {allowShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share className="h-4 w-4" />
              </Button>
            )}
            
            {allowFavorites && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className={cn(
                  "text-white hover:bg-white/20",
                  favorites.has(currentImage.id) && "text-red-500"
                )}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  favorites.has(currentImage.id) && "fill-current"
                )} />
              </Button>
            )}
            
            {allowBookmarks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={cn(
                  "text-white hover:bg-white/20",
                  bookmarks.has(currentImage.id) && "text-blue-500"
                )}
              >
                <Bookmark className={cn(
                  "h-4 w-4",
                  bookmarks.has(currentImage.id) && "fill-current"
                )} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Metadata panel */}
      {showMetadataPanel && currentImage.metadata && (
        <div className="absolute top-16 right-4 bg-black/80 text-white p-4 rounded-lg text-sm space-y-2 min-w-64">
          <h3 className="font-semibold">Información de la imagen</h3>
          <div className="space-y-1">
            <div>Nombre: {currentImage.name}</div>
            <div>Tamaño: {formatFileSize(currentImage.size)}</div>
            <div>Dimensiones: {currentImage.metadata.width}×{currentImage.metadata.height}</div>
            <div>Formato: {currentImage.metadata.format}</div>
            {currentImage.metadata.camera?.make && (
              <div>Cámara: {currentImage.metadata.camera.make} {currentImage.metadata.camera.model}</div>
            )}
            {currentImage.metadata.createdAt && (
              <div>Fecha: {new Date(currentImage.metadata.createdAt).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="absolute top-16 left-4 bg-black/80 text-white p-4 rounded-lg text-sm space-y-3 min-w-64">
          <h3 className="font-semibold">Filtros</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1">Brillo</label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) => setFilters(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Contraste</label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) => setFilters(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Saturación</label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={(e) => setFilters(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Desenfoque</label>
              <input
                type="range"
                min="0"
                max="10"
                value={filters.blur}
                onChange={(e) => setFilters(prev => ({ ...prev, blur: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
                blur: 0,
                sepia: 0,
                grayscale: 0,
                invert: 0
              })}
              className="w-full"
            >
              Reset Filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
