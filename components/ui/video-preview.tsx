"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  RotateCw,
  Info,
  Video as VideoIcon,
  FileVideo
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPreviewProps {
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
  autoplay?: boolean
  muted?: boolean
}

interface VideoMetadata {
  duration: number
  width: number
  height: number
  aspectRatio: string
  fileSize: string
  format: string
  dimensions: string
  bitrate?: number
  fps?: number
}

export function VideoPreview({
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
  maxHeight = 300,
  autoplay = false,
  muted = true,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  // Extraer metadatos del video
  const extractMetadata = (video: HTMLVideoElement) => {
    const aspectRatio = (video.videoWidth / video.videoHeight).toFixed(2)
    const format = type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
    
    setMetadata({
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      aspectRatio,
      fileSize: formatFileSize(size),
      format,
      dimensions: `${video.videoWidth} × ${video.videoHeight}`,
      bitrate: size / video.duration, // Estimación básica
      fps: 30 // Valor por defecto, se podría calcular
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleVideoLoad = () => {
    setLoading(false)
    setError(false)
    if (videoRef.current) {
      extractMetadata(videoRef.current)
    }
  }

  const handleVideoError = () => {
    setLoading(false)
    setError(true)
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleMute = () => {
    if (!videoRef.current) return
    
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return
    
    videoRef.current.volume = newVolume
    setVolume(newVolume)
  }

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
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

  const handleRestart = () => {
    if (!videoRef.current) return
    
    videoRef.current.currentTime = 0
    setCurrentTime(0)
    if (!isPlaying) {
      handlePlayPause()
    }
  }

  // Event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
    }
  }, [])

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25",
        className
      )}>
        <div className="text-center p-4">
          <FileVideo className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Error al cargar video</p>
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

        {/* Video */}
        <video
          ref={videoRef}
          src={src}
          className={cn(
            "transition-all duration-300 ease-in-out",
            loading && "opacity-0",
            !isFullscreen && "max-w-full h-auto"
          )}
          style={{
            maxWidth: isFullscreen ? 'none' : `${maxWidth}px`,
            maxHeight: isFullscreen ? 'none' : `${maxHeight}px`,
            width: isFullscreen ? '100%' : 'auto',
            height: isFullscreen ? '100%' : 'auto',
          }}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          muted={isMuted}
          preload="metadata"
        />

        {/* Overlay con controles */}
        {showControls && (
          <div className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200",
            isFullscreen && "bg-black/20"
          )}>
            {/* Controles superiores */}
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

            {/* Controles centrales */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={handlePlayPause}
                className="h-16 w-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>
            </div>

            {/* Controles inferiores */}
            <div className="absolute bottom-2 left-2 right-2 space-y-2">
              {/* Barra de progreso */}
              <div className="flex items-center gap-2 text-white text-xs">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-white rounded-full h-1 transition-all duration-200 cursor-pointer"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const clickX = e.clientX - rect.left
                      const newTime = (clickX / rect.width) * duration
                      handleSeek(newTime)
                    }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Controles de reproducción */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePlayPause}
                    className="h-8 w-8 p-0"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRestart}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>

                  <div className="relative">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      className="h-8 w-8 p-0"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {showVolumeSlider && (
                      <div className="absolute bottom-10 left-0 bg-black/80 rounded p-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
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

        {/* Indicador de duración */}
        {duration > 0 && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {formatTime(duration)}
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
            <span>{formatTime(metadata.duration)}</span>
            <span>Aspect: {metadata.aspectRatio}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para galería de videos
interface VideoGalleryProps {
  videos: Array<{
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
  maxVideos?: number
}

export function VideoGallery({ 
  videos, 
  onRemove, 
  onDownload, 
  className,
  maxVideos = 4 
}: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const visibleVideos = videos.slice(0, maxVideos)
  const remainingCount = videos.length - maxVideos

  const handleVideoClick = (index: number) => {
    setSelectedVideo(videos[index].src)
    setCurrentIndex(index)
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % videos.length
    setCurrentIndex(nextIndex)
    setSelectedVideo(videos[nextIndex].src)
  }

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length
    setCurrentIndex(prevIndex)
    setSelectedVideo(videos[prevIndex].src)
  }

  const handleClose = () => {
    setSelectedVideo(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Grid de videos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {visibleVideos.map((video, index) => (
          <div
            key={video.id}
            className="relative aspect-video cursor-pointer group"
            onClick={() => handleVideoClick(index)}
          >
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.name}
                className="w-full h-full object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-lg border flex items-center justify-center">
                <VideoIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            {/* Overlay con play button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded-full p-2">
                  <Play className="h-6 w-6 text-black" />
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
                  onRemove?.(video.id)
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Indicador de más videos */}
        {remainingCount > 0 && (
          <div className="aspect-video flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25">
            <div className="text-center">
              <VideoIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">+{remainingCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de video seleccionado */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <VideoPreview
              src={selectedVideo}
              name={videos[currentIndex]?.name}
              size={videos[currentIndex]?.size || 0}
              type={videos[currentIndex]?.type || 'video/mp4'}
              showControls={true}
              showMetadata={false}
              className="w-full h-full"
            />
            
            {/* Controles de navegación */}
            {videos.length > 1 && (
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
              <p className="text-sm font-medium">{videos[currentIndex]?.name}</p>
              <p className="text-xs opacity-75">
                {currentIndex + 1} de {videos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
