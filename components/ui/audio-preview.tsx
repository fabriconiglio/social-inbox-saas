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
  RotateCw,
  Info,
  Music,
  FileAudio,
  SkipBack,
  SkipForward
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioPreviewProps {
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

interface AudioMetadata {
  duration: number
  bitrate?: number
  sampleRate?: number
  channels?: number
  fileSize: string
  format: string
  title?: string
  artist?: string
  album?: string
  year?: number
}

export function AudioPreview({
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
  maxHeight = 200,
  autoplay = false,
  muted = true,
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isLooping, setIsLooping] = useState(false)

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

  const getAudioIcon = (type: string) => {
    if (type.includes('audio')) return <Music className="h-8 w-8 text-purple-500" />
    return <FileAudio className="h-8 w-8 text-gray-500" />
  }

  const getAudioType = (type: string): string => {
    if (type.includes('mp3')) return 'MP3'
    if (type.includes('wav')) return 'WAV'
    if (type.includes('ogg')) return 'OGG'
    if (type.includes('flac')) return 'FLAC'
    if (type.includes('aac')) return 'AAC'
    return 'Audio'
  }

  const handleAudioLoad = () => {
    setLoading(false)
    setError(false)
    
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      
      // Extraer metadatos básicos
      setMetadata({
        duration: audioRef.current.duration,
        fileSize: formatFileSize(size),
        format: getAudioType(type),
        title: name.replace(/\.[^/.]+$/, ""), // Remover extensión
      })
    }
  }

  const handleAudioError = () => {
    setLoading(false)
    setError(true)
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleMute = () => {
    if (!audioRef.current) return
    
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef.current) return
    
    audioRef.current.volume = newVolume
    setVolume(newVolume)
  }

  const handleSeek = (newTime: number) => {
    if (!audioRef.current) return
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
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
    if (!audioRef.current) return
    
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    if (!isPlaying) {
      handlePlayPause()
    }
  }

  const handleSkipBack = () => {
    if (!audioRef.current) return
    
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
  }

  const handleSkipForward = () => {
    if (!audioRef.current) return
    
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
  }

  const handleLoop = () => {
    if (!audioRef.current) return
    
    audioRef.current.loop = !isLooping
    setIsLooping(!isLooping)
  }

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(audio.volume)
      setIsMuted(audio.muted)
    }
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('volumechange', handleVolumeChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('volumechange', handleVolumeChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25",
        className
      )}>
        <div className="text-center p-4">
          <FileAudio className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Error al cargar audio</p>
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
        "p-4"
      )}>
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Audio element */}
        <audio
          ref={audioRef}
          src={src}
          className="hidden"
          onLoadedData={handleAudioLoad}
          onError={handleAudioError}
          muted={isMuted}
          preload="metadata"
        />

        {/* Contenido del reproductor */}
        <div className="space-y-3">
          {/* Header con icono y controles superiores */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getAudioIcon(type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground">{getAudioType(type)} • {formatFileSize(size)}</p>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
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
              
              {onRemove && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Controles de reproducción */}
          {showControls && (
            <div className="space-y-2">
              {/* Barra de progreso */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 bg-muted rounded-full h-1">
                  <div 
                    className="bg-primary rounded-full h-1 transition-all duration-200 cursor-pointer"
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

              {/* Controles principales */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipBack}
                  className="h-8 w-8 p-0"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePlayPause}
                  className="h-10 w-10 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipForward}
                  className="h-8 w-8 p-0"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="h-8 w-8 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={isLooping ? "default" : "ghost"}
                  size="sm"
                  onClick={handleLoop}
                  className="h-8 w-8 p-0"
                >
                  <span className="text-xs">∞</span>
                </Button>
              </div>

              {/* Controles adicionales */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-1">
                  {duration > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {formatTime(duration)}
                    </Badge>
                  )}
                  {isLooping && (
                    <Badge variant="outline" className="text-xs">
                      Loop
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Slider de volumen */}
          {showVolumeSlider && (
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <Volume2 className="h-4 w-4" />
            </div>
          )}
        </div>
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
            <span>{formatTime(metadata.duration)}</span>
            {metadata.bitrate && <span>{metadata.bitrate} kbps</span>}
            {metadata.sampleRate && <span>{metadata.sampleRate} Hz</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para galería de audio
interface AudioGalleryProps {
  audios: Array<{
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
  maxAudios?: number
}

export function AudioGallery({ 
  audios, 
  onRemove, 
  onDownload, 
  className,
  maxAudios = 4 
}: AudioGalleryProps) {
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const visibleAudios = audios.slice(0, maxAudios)
  const remainingCount = audios.length - maxAudios

  const handleAudioClick = (index: number) => {
    setSelectedAudio(audios[index].src)
    setCurrentIndex(index)
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % audios.length
    setCurrentIndex(nextIndex)
    setSelectedAudio(audios[nextIndex].src)
  }

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + audios.length) % audios.length
    setCurrentIndex(prevIndex)
    setSelectedAudio(audios[prevIndex].src)
  }

  const handleClose = () => {
    setSelectedAudio(null)
  }

  const getAudioIcon = (type: string) => {
    if (type.includes('audio')) return <Music className="h-6 w-6 text-purple-500" />
    return <FileAudio className="h-6 w-6 text-gray-500" />
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
      {/* Grid de audios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {visibleAudios.map((audio, index) => (
          <div
            key={audio.id}
            className="relative cursor-pointer group"
            onClick={() => handleAudioClick(index)}
          >
            <div className="w-full bg-muted rounded-lg border p-3 hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-3">
                {getAudioIcon(audio.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{audio.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(audio.size)}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-primary rounded-full p-1">
                    <Play className="h-3 w-3 text-primary-foreground" />
                  </div>
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
                  onRemove?.(audio.id)
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Indicador de más audios */}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
            <div className="text-center">
              <Music className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">+{remainingCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de audio seleccionado */}
      {selectedAudio && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="relative bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <AudioPreview
              src={selectedAudio}
              name={audios[currentIndex]?.name}
              size={audios[currentIndex]?.size || 0}
              type={audios[currentIndex]?.type || 'audio/mpeg'}
              showControls={true}
              showMetadata={true}
              onRemove={handleClose}
            />
            
            {/* Controles de navegación */}
            {audios.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                >
                  ←
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
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
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Información */}
            <div className="absolute bottom-2 left-2 text-muted-foreground">
              <p className="text-xs">
                {currentIndex + 1} de {audios.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
