"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
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
  RotateCcw,
  SkipBack,
  SkipForward,
  Settings,
  Share,
  Heart,
  Bookmark,
  Eye,
  EyeOff,
  Subtitles,
  Monitor,
  Smartphone,
  Tablet,
  Zap,
  Clock,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  name: string
  size: number
  type: string
  poster?: string
  onClose?: () => void
  onDownload?: () => void
  onShare?: () => void
  onFavorite?: () => void
  onBookmark?: () => void
  className?: string
  showMetadata?: boolean
  showControls?: boolean
  allowFullscreen?: boolean
  allowDownload?: boolean
  allowShare?: boolean
  allowFavorites?: boolean
  allowBookmarks?: boolean
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  subtitles?: Array<{
    src: string
    label: string
    language: string
    default?: boolean
  }>
  qualities?: Array<{
    src: string
    label: string
    quality: string
    default?: boolean
  }>
}

interface VideoMetadata {
  duration: number
  bitrate: number
  resolution: string
  frameRate: number
  codec: string
  fileSize: string
  format: string
  title?: string
  artist?: string
  album?: string
  year?: number
}

export function VideoPlayer({
  src,
  name,
  size,
  type,
  poster,
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
  muted = true,
  loop = false,
  subtitles = [],
  qualities = []
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeRef = useRef<HTMLDivElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [showPlaybackSpeedMenu, setShowPlaybackSpeedMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [selectedQuality, setSelectedQuality] = useState(qualities.find(q => q.default)?.src || src)
  const [selectedSubtitle, setSelectedSubtitle] = useState(subtitles.find(s => s.default)?.src || '')
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [showHoverTime, setShowHoverTime] = useState(false)

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleMute = useCallback(() => {
    if (!videoRef.current) return
    
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return
    
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }, [])

  const handleSeek = useCallback((newTime: number) => {
    if (!videoRef.current) return
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !videoRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    handleSeek(newTime)
  }, [duration, handleSeek])

  const handleProgressHover = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const hoverX = e.clientX - rect.left
    const hoverTime = (hoverX / rect.width) * duration
    setHoverTime(hoverTime)
    setShowHoverTime(true)
  }, [duration])

  const handleProgressLeave = useCallback(() => {
    setShowHoverTime(false)
  }, [])

  const handleSkipBack = useCallback(() => {
    if (!videoRef.current) return
    
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
  }, [])

  const handleSkipForward = useCallback(() => {
    if (!videoRef.current) return
    
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
  }, [duration])

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

  const handleQualityChange = useCallback((qualitySrc: string) => {
    if (!videoRef.current) return
    
    setSelectedQuality(qualitySrc)
    videoRef.current.src = qualitySrc
    setShowQualityMenu(false)
  }, [])

  const handleSubtitleChange = useCallback((subtitleSrc: string) => {
    if (!videoRef.current) return
    
    setSelectedSubtitle(subtitleSrc)
    // Aquí se implementaría la lógica de subtítulos
    setShowSubtitleMenu(false)
  }, [])

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (!videoRef.current) return
    
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
    setShowPlaybackSpeedMenu(false)
  }, [])

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload()
    } else {
      const link = document.createElement('a')
      link.href = src
      link.download = name
      link.click()
    }
  }, [src, name, onDownload])

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare()
    } else if (navigator.share) {
      navigator.share({
        title: name,
        url: src
      })
    }
  }, [name, src, onShare])

  const handleFavorite = useCallback(() => {
    onFavorite?.()
  }, [onFavorite])

  const handleBookmark = useCallback(() => {
    onBookmark?.()
  }, [onBookmark])

  // Event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setLoading(false)
      setError(false)
      
      // Extraer metadatos básicos
      setMetadata({
        duration: video.duration,
        bitrate: Math.round((size * 8) / video.duration / 1000), // kbps estimado
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        frameRate: 30, // Valor por defecto
        codec: 'H.264', // Valor por defecto
        fileSize: formatFileSize(size),
        format: type.split('/')[1]?.toUpperCase() || 'MP4',
        title: name.replace(/\.[^/.]+$/, ""), // Remover extensión
      })
    }

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      setError(true)
      setLoading(false)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [size, type, name])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showControls) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSkipBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSkipForward()
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
          break
        case 'm':
        case 'M':
          e.preventDefault()
          handleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          handleFullscreen()
          break
        case 'Escape':
          e.preventDefault()
          onClose?.()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showControls, handlePlayPause, handleSkipBack, handleSkipForward, handleVolumeChange, volume, handleMute, handleFullscreen, onClose])

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25",
        className
      )}>
        <div className="text-center p-4">
          <Monitor className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Error al cargar video</p>
          <p className="text-xs text-muted-foreground mt-1">{name}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group overflow-hidden rounded-lg border bg-black",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={selectedQuality}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
      />

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Overlay con controles */}
      {showControls && (
        <div className={cn(
          "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200",
          isFullscreen && "bg-black/10"
        )}>
          {/* Controles superiores */}
          <div className="absolute top-2 right-2 flex gap-1">
            {allowShare && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Share className="h-4 w-4" />
              </Button>
            )}
            {allowFavorites && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFavorite}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
            {allowBookmarks && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBookmark}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Controles inferiores */}
          <div className="absolute bottom-2 left-2 right-2 space-y-2">
            {/* Barra de progreso */}
            <div className="relative">
              <div
                ref={progressRef}
                className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
                onClick={handleProgressClick}
                onMouseMove={handleProgressHover}
                onMouseLeave={handleProgressLeave}
              >
                <div 
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                {showHoverTime && (
                  <div 
                    className="absolute top-0 h-1 w-1 bg-white rounded-full"
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                  />
                )}
              </div>
              
              {/* Tooltip de tiempo */}
              {showHoverTime && (
                <div 
                  className="absolute bottom-2 bg-black/80 text-white text-xs px-2 py-1 rounded"
                  style={{ left: `${(hoverTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>

            {/* Controles principales */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
                  onClick={handleSkipBack}
                  className="h-8 w-8 p-0"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSkipForward}
                  className="h-8 w-8 p-0"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 text-white text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Control de volumen */}
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
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/80 rounded p-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Configuración */}
                <div className="relative">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  {showSettings && (
                    <div className="absolute bottom-10 right-0 bg-black/80 rounded p-2 space-y-1 min-w-32">
                      {/* Calidad */}
                      {qualities.length > 0 && (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowQualityMenu(!showQualityMenu)}
                            className="w-full justify-between text-white"
                          >
                            <Monitor className="h-4 w-4" />
                            <span className="text-xs">Calidad</span>
                            {showQualityMenu ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                          
                          {showQualityMenu && (
                            <div className="absolute bottom-8 left-0 bg-black/90 rounded p-1 space-y-1 min-w-24">
                              {qualities.map((quality) => (
                                <Button
                                  key={quality.src}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQualityChange(quality.src)}
                                  className={cn(
                                    "w-full text-xs text-white",
                                    selectedQuality === quality.src && "bg-white/20"
                                  )}
                                >
                                  {quality.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Subtítulos */}
                      {subtitles.length > 0 && (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                            className="w-full justify-between text-white"
                          >
                            <Subtitles className="h-4 w-4" />
                            <span className="text-xs">Subtítulos</span>
                            {showSubtitleMenu ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                          
                          {showSubtitleMenu && (
                            <div className="absolute bottom-8 left-0 bg-black/90 rounded p-1 space-y-1 min-w-24">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSubtitleChange('')}
                                className={cn(
                                  "w-full text-xs text-white",
                                  selectedSubtitle === '' && "bg-white/20"
                                )}
                              >
                                Sin subtítulos
                              </Button>
                              {subtitles.map((subtitle) => (
                                <Button
                                  key={subtitle.src}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSubtitleChange(subtitle.src)}
                                  className={cn(
                                    "w-full text-xs text-white",
                                    selectedSubtitle === subtitle.src && "bg-white/20"
                                  )}
                                >
                                  {subtitle.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Velocidad de reproducción */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPlaybackSpeedMenu(!showPlaybackSpeedMenu)}
                          className="w-full justify-between text-white"
                        >
                          <Zap className="h-4 w-4" />
                          <span className="text-xs">{playbackRate}x</span>
                          {showPlaybackSpeedMenu ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                        
                        {showPlaybackSpeedMenu && (
                          <div className="absolute bottom-8 left-0 bg-black/90 rounded p-1 space-y-1 min-w-24">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                              <Button
                                key={rate}
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePlaybackRateChange(rate)}
                                className={cn(
                                  "w-full text-xs text-white",
                                  playbackRate === rate && "bg-white/20"
                                )}
                              >
                                {rate}x
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pantalla completa */}
                {allowFullscreen && (
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
                )}
                
                {/* Descarga */}
                {allowDownload && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadatos */}
      {showMetadata && metadata && (
        <div className="absolute top-12 right-2 bg-black/80 text-white p-3 rounded-lg text-xs space-y-1 min-w-48">
          <div className="font-medium">{name}</div>
          <div>Resolución: {metadata.resolution}</div>
          <div>Duración: {formatTime(metadata.duration)}</div>
          <div>Bitrate: {metadata.bitrate} kbps</div>
          <div>Tamaño: {metadata.fileSize}</div>
          <div>Formato: {metadata.format}</div>
          {metadata.title && <div>Título: {metadata.title}</div>}
          {metadata.artist && <div>Artista: {metadata.artist}</div>}
          {metadata.year && <div>Año: {metadata.year}</div>}
        </div>
      )}
    </div>
  )
}
