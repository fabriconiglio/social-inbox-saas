"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

interface VideoPlayerState {
  isPlaying: boolean
  isMuted: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isFullscreen: boolean
  loading: boolean
  error: boolean
  selectedQuality: string
  selectedSubtitle: string
  showVolumeSlider: boolean
  showSettings: boolean
  showQualityMenu: boolean
  showSubtitleMenu: boolean
  showPlaybackSpeedMenu: boolean
  isDragging: boolean
  hoverTime: number
  showHoverTime: boolean
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

interface UseVideoPlayerReturn {
  // State
  state: VideoPlayerState
  metadata: VideoMetadata | null
  
  // Playback controls
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  skipBack: (seconds?: number) => void
  skipForward: (seconds?: number) => void
  
  // Volume controls
  setVolume: (volume: number) => void
  mute: () => void
  unmute: () => void
  toggleMute: () => void
  
  // Playback rate
  setPlaybackRate: (rate: number) => void
  
  // Fullscreen
  toggleFullscreen: () => void
  enterFullscreen: () => void
  exitFullscreen: () => void
  
  // Quality
  setQuality: (qualitySrc: string) => void
  
  // Subtitles
  setSubtitle: (subtitleSrc: string) => void
  
  // UI controls
  toggleVolumeSlider: () => void
  toggleSettings: () => void
  toggleQualityMenu: () => void
  toggleSubtitleMenu: () => void
  togglePlaybackSpeedMenu: () => void
  
  // Progress
  handleProgressClick: (e: React.MouseEvent) => void
  handleProgressHover: (e: React.MouseEvent) => void
  handleProgressLeave: () => void
  
  // Formatting
  formatTime: (time: number) => string
  formatFileSize: (bytes: number) => string
  
  // Reset
  resetPlayer: () => void
}

export function useVideoPlayer(
  videoRef: React.RefObject<HTMLVideoElement>,
  containerRef: React.RefObject<HTMLDivElement>,
  initialSrc: string,
  qualities: Array<{ src: string; label: string; quality: string; default?: boolean }> = [],
  subtitles: Array<{ src: string; label: string; language: string; default?: boolean }> = []
): UseVideoPlayerReturn {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: true,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isFullscreen: false,
    loading: true,
    error: false,
    selectedQuality: qualities.find(q => q.default)?.src || initialSrc,
    selectedSubtitle: subtitles.find(s => s.default)?.src || '',
    showVolumeSlider: false,
    showSettings: false,
    showQualityMenu: false,
    showSubtitleMenu: false,
    showPlaybackSpeedMenu: false,
    isDragging: false,
    hoverTime: 0,
    showHoverTime: false
  })

  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: video.duration,
        loading: false,
        error: false
      }))
      
      // Extraer metadatos básicos
      setMetadata({
        duration: video.duration,
        bitrate: Math.round((video.videoWidth * video.videoHeight * 30 * 8) / 1000), // kbps estimado
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        frameRate: 30, // Valor por defecto
        codec: 'H.264', // Valor por defecto
        fileSize: '0 Bytes', // Se calcularía con el archivo real
        format: 'MP4',
        title: video.title || ''
      })
    }

    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: video.currentTime
      }))
    }

    const handlePlay = () => {
      setState(prev => ({
        ...prev,
        isPlaying: true
      }))
    }

    const handlePause = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false
      }))
    }

    const handleVolumeChange = () => {
      setState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted
      }))
    }

    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false
      }))
    }

    const handleError = () => {
      setState(prev => ({
        ...prev,
        error: true,
        loading: false
      }))
    }

    const handleLoadStart = () => {
      setState(prev => ({
        ...prev,
        loading: true
      }))
    }

    const handleCanPlay = () => {
      setState(prev => ({
        ...prev,
        loading: false
      }))
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [videoRef])

  // Playback controls
  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play()
    }
  }, [videoRef])

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [videoRef])

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (state.isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }, [videoRef, state.isPlaying])

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }, [videoRef])

  const skipBack = useCallback((seconds: number = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - seconds)
    }
  }, [videoRef])

  const skipForward = useCallback((seconds: number = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(state.duration, videoRef.current.currentTime + seconds)
    }
  }, [videoRef, state.duration])

  // Volume controls
  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      if (volume === 0) {
        videoRef.current.muted = true
      } else {
        videoRef.current.muted = false
      }
    }
  }, [videoRef])

  const mute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = true
    }
  }, [videoRef])

  const unmute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false
    }
  }, [videoRef])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !state.isMuted
    }
  }, [videoRef, state.isMuted])

  // Playback rate
  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }, [videoRef])

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [containerRef])

  const enterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen()
  }, [containerRef])

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen()
  }, [])

  // Quality
  const setQuality = useCallback((qualitySrc: string) => {
    if (videoRef.current) {
      videoRef.current.src = qualitySrc
      setState(prev => ({
        ...prev,
        selectedQuality: qualitySrc
      }))
    }
  }, [videoRef])

  // Subtitles
  const setSubtitle = useCallback((subtitleSrc: string) => {
    setState(prev => ({
      ...prev,
      selectedSubtitle: subtitleSrc
    }))
    // Aquí se implementaría la lógica de subtítulos
  }, [])

  // UI controls
  const toggleVolumeSlider = useCallback(() => {
    setState(prev => ({
      ...prev,
      showVolumeSlider: !prev.showVolumeSlider
    }))
  }, [])

  const toggleSettings = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSettings: !prev.showSettings
    }))
  }, [])

  const toggleQualityMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      showQualityMenu: !prev.showQualityMenu
    }))
  }, [])

  const toggleSubtitleMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSubtitleMenu: !prev.showSubtitleMenu
    }))
  }, [])

  const togglePlaybackSpeedMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      showPlaybackSpeedMenu: !prev.showPlaybackSpeedMenu
    }))
  }, [])

  // Progress
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !videoRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * state.duration
    seek(newTime)
  }, [state.duration, seek])

  const handleProgressHover = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const hoverX = e.clientX - rect.left
    const hoverTime = (hoverX / rect.width) * state.duration
    setState(prev => ({
      ...prev,
      hoverTime,
      showHoverTime: true
    }))
  }, [state.duration])

  const handleProgressLeave = useCallback(() => {
    setState(prev => ({
      ...prev,
      showHoverTime: false
    }))
  }, [])

  // Formatting
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Reset
  const resetPlayer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      volume: 1,
      playbackRate: 1,
      isFullscreen: false,
      loading: true,
      error: false,
      showVolumeSlider: false,
      showSettings: false,
      showQualityMenu: false,
      showSubtitleMenu: false,
      showPlaybackSpeedMenu: false,
      isDragging: false,
      hoverTime: 0,
      showHoverTime: false
    }))
    setMetadata(null)
  }, [])

  return {
    // State
    state,
    metadata,
    
    // Playback controls
    play,
    pause,
    togglePlayPause,
    seek,
    skipBack,
    skipForward,
    
    // Volume controls
    setVolume,
    mute,
    unmute,
    toggleMute,
    
    // Playback rate
    setPlaybackRate,
    
    // Fullscreen
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    
    // Quality
    setQuality,
    
    // Subtitles
    setSubtitle,
    
    // UI controls
    toggleVolumeSlider,
    toggleSettings,
    toggleQualityMenu,
    toggleSubtitleMenu,
    togglePlaybackSpeedMenu,
    
    // Progress
    handleProgressClick,
    handleProgressHover,
    handleProgressLeave,
    
    // Formatting
    formatTime,
    formatFileSize,
    
    // Reset
    resetPlayer
  }
}

// Hook para metadatos de video
export function useVideoMetadata() {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)

  const extractMetadata = useCallback(async (file: File): Promise<VideoMetadata | null> => {
    try {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const metadata: VideoMetadata = {
            duration: video.duration,
            bitrate: Math.round((file.size * 8) / video.duration / 1000), // kbps estimado
            resolution: `${video.videoWidth}x${video.videoHeight}`,
            frameRate: 30, // Valor por defecto
            codec: 'H.264', // Valor por defecto
            fileSize: formatFileSize(file.size),
            format: file.type.split('/')[1]?.toUpperCase() || 'MP4',
            title: file.name.replace(/\.[^/.]+$/, ""), // Remover extensión
          }
          
          URL.revokeObjectURL(url)
          resolve(metadata)
        }
        
        video.onerror = () => {
          URL.revokeObjectURL(url)
          resolve(null)
        }
        
        video.src = url
      })
    } catch (error) {
      console.error('[useVideoMetadata] Error:', error)
      return null
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const updateMetadata = useCallback((newMetadata: VideoMetadata) => {
    setMetadata(newMetadata)
  }, [])

  return {
    metadata,
    extractMetadata,
    updateMetadata
  }
}

// Hook para calidad de video
export function useVideoQuality() {
  const [qualities, setQualities] = useState<Array<{
    src: string
    label: string
    quality: string
    default?: boolean
  }>>([])

  const addQuality = useCallback((quality: {
    src: string
    label: string
    quality: string
    default?: boolean
  }) => {
    setQualities(prev => [...prev, quality])
  }, [])

  const removeQuality = useCallback((src: string) => {
    setQualities(prev => prev.filter(q => q.src !== src))
  }, [])

  const setDefaultQuality = useCallback((src: string) => {
    setQualities(prev => prev.map(q => ({
      ...q,
      default: q.src === src
    })))
  }, [])

  const getDefaultQuality = useCallback(() => {
    return qualities.find(q => q.default) || qualities[0]
  }, [qualities])

  return {
    qualities,
    addQuality,
    removeQuality,
    setDefaultQuality,
    getDefaultQuality
  }
}

// Hook para subtítulos
export function useVideoSubtitles() {
  const [subtitles, setSubtitles] = useState<Array<{
    src: string
    label: string
    language: string
    default?: boolean
  }>>([])

  const addSubtitle = useCallback((subtitle: {
    src: string
    label: string
    language: string
    default?: boolean
  }) => {
    setSubtitles(prev => [...prev, subtitle])
  }, [])

  const removeSubtitle = useCallback((src: string) => {
    setSubtitles(prev => prev.filter(s => s.src !== src))
  }, [])

  const setDefaultSubtitle = useCallback((src: string) => {
    setSubtitles(prev => prev.map(s => ({
      ...s,
      default: s.src === src
    })))
  }, [])

  const getDefaultSubtitle = useCallback(() => {
    return subtitles.find(s => s.default) || subtitles[0]
  }, [subtitles])

  return {
    subtitles,
    addSubtitle,
    removeSubtitle,
    setDefaultSubtitle,
    getDefaultSubtitle
  }
}
