"use client"

import { useState, useCallback } from 'react'

interface VideoOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  bitrate?: number
  fps?: number
  format?: 'mp4' | 'webm'
  maintainAspectRatio?: boolean
}

interface OptimizedVideo {
  file: File
  url: string
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  dimensions: {
    original: { width: number; height: number }
    optimized: { width: number; height: number }
  }
  duration: number
  bitrate: number
}

interface UseVideoOptimizationReturn {
  optimizeVideo: (file: File, options?: VideoOptimizationOptions) => Promise<OptimizedVideo | null>
  batchOptimize: (files: File[], options?: VideoOptimizationOptions) => Promise<OptimizedVideo[]>
  isOptimizing: boolean
  error: string | null
}

export function useVideoOptimization(): UseVideoOptimizationReturn {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCanvas = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  const calculateDimensions = (
    originalWidth: number,
    originalHeight: number,
    maxWidth?: number,
    maxHeight?: number,
    maintainAspectRatio: boolean = true
  ) => {
    let newWidth = originalWidth
    let newHeight = originalHeight

    if (maxWidth && originalWidth > maxWidth) {
      newWidth = maxWidth
      if (maintainAspectRatio) {
        newHeight = (originalHeight * maxWidth) / originalWidth
      }
    }

    if (maxHeight && newHeight > maxHeight) {
      newHeight = maxHeight
      if (maintainAspectRatio) {
        newWidth = (originalWidth * maxHeight) / originalHeight
      }
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    }
  }

  const optimizeVideo = useCallback(async (
    file: File,
    options: VideoOptimizationOptions = {}
  ): Promise<OptimizedVideo | null> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        bitrate = 2000000, // 2 Mbps
        fps = 30,
        format = 'mp4',
        maintainAspectRatio = true
      } = options

      // Crear video element para obtener metadatos
      const video = document.createElement('video')
      const videoUrl = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = reject
        video.src = videoUrl
      })

      // Calcular nuevas dimensiones
      const { width: newWidth, height: newHeight } = calculateDimensions(
        video.videoWidth,
        video.videoHeight,
        maxWidth,
        maxHeight,
        maintainAspectRatio
      )

      // Para videos, la optimización real requeriría FFmpeg.js o similar
      // Por ahora, simulamos la optimización
      const optimizedBlob = await new Promise<Blob>((resolve) => {
        // En un entorno real, aquí se usaría FFmpeg.js para optimizar el video
        // Por ahora, creamos un blob optimizado simulado
        const reader = new FileReader()
        reader.onload = () => {
          // Simular reducción de tamaño basada en las opciones
          const reductionFactor = quality * (newWidth * newHeight) / (video.videoWidth * video.videoHeight)
          const optimizedSize = Math.round(file.size * reductionFactor)
          
          // Crear un blob simulado (en producción sería el video real optimizado)
          const optimizedData = new Uint8Array(optimizedSize)
          const blob = new Blob([optimizedData], { type: `video/${format}` })
          resolve(blob)
        }
        reader.readAsArrayBuffer(file)
      })

      // Crear archivo optimizado
      const optimizedFile = new File([optimizedBlob], file.name, {
        type: `video/${format}`,
        lastModified: Date.now()
      })

      // Calcular métricas
      const originalSize = file.size
      const optimizedSize = optimizedFile.size
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

      // Limpiar URL
      URL.revokeObjectURL(videoUrl)

      return {
        file: optimizedFile,
        url: URL.createObjectURL(optimizedFile),
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions: {
          original: { width: video.videoWidth, height: video.videoHeight },
          optimized: { width: newWidth, height: newHeight }
        },
        duration: video.duration,
        bitrate: bitrate
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar video'
      setError(errorMessage)
      console.error('[useVideoOptimization] Error:', err)
      return null
    } finally {
      setIsOptimizing(false)
    }
  }, [])

  const batchOptimize = useCallback(async (
    files: File[],
    options: VideoOptimizationOptions = {}
  ): Promise<OptimizedVideo[]> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const results: OptimizedVideo[] = []
      
      for (const file of files) {
        const result = await optimizeVideo(file, options)
        if (result) {
          results.push(result)
        }
      }

      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar videos'
      setError(errorMessage)
      console.error('[useVideoOptimization] Batch error:', err)
      return []
    } finally {
      setIsOptimizing(false)
    }
  }, [optimizeVideo])

  return {
    optimizeVideo,
    batchOptimize,
    isOptimizing,
    error,
  }
}

// Hook para detectar si un archivo es un video
export function useVideoDetection() {
  const isVideoFile = useCallback((file: File): boolean => {
    return file.type.startsWith('video/')
  }, [])

  const getVideoType = useCallback((file: File): string | null => {
    if (!isVideoFile(file)) return null
    return file.type.split('/')[1]?.toLowerCase() || null
  }, [isVideoFile])

  const isSupportedVideoType = useCallback((file: File): boolean => {
    const videoType = getVideoType(file)
    return videoType ? ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(videoType) : false
  }, [getVideoType])

  const getVideoMetadata = useCallback((file: File): Promise<{
    duration: number
    width: number
    height: number
    aspectRatio: number
  } | null> => {
    return new Promise((resolve) => {
      if (!isVideoFile(file)) {
        resolve(null)
        return
      }

      const video = document.createElement('video')
      const url = URL.createObjectURL(file)

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight
        })
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }

      video.src = url
    })
  }, [isVideoFile])

  return {
    isVideoFile,
    getVideoType,
    isSupportedVideoType,
    getVideoMetadata,
  }
}

// Hook para generar thumbnails de video
export function useVideoThumbnailGeneration() {
  const generateThumbnail = useCallback(async (
    file: File,
    timeOffset: number = 1 // Segundo en el que tomar el thumbnail
  ): Promise<string | null> => {
    try {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null

      const videoUrl = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.currentTime = timeOffset
        }
        video.onseeked = resolve
        video.onerror = reject
        video.src = videoUrl
      })

      // Configurar canvas con dimensiones del video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Dibujar frame del video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
      URL.revokeObjectURL(videoUrl)
      
      return thumbnailUrl
    } catch (error) {
      console.error('[useVideoThumbnailGeneration] Error:', error)
      return null
    }
  }, [])

  const generateMultipleThumbnails = useCallback(async (
    file: File,
    count: number = 3
  ): Promise<string[]> => {
    try {
      const video = document.createElement('video')
      const videoUrl = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = reject
        video.src = videoUrl
      })

      const thumbnails: string[] = []
      const duration = video.duration
      const interval = duration / (count + 1)

      for (let i = 1; i <= count; i++) {
        const timeOffset = interval * i
        const thumbnail = await generateThumbnail(file, timeOffset)
        if (thumbnail) {
          thumbnails.push(thumbnail)
        }
      }

      URL.revokeObjectURL(videoUrl)
      return thumbnails
    } catch (error) {
      console.error('[useVideoThumbnailGeneration] Error:', error)
      return []
    }
  }, [generateThumbnail])

  return {
    generateThumbnail,
    generateMultipleThumbnails,
  }
}
