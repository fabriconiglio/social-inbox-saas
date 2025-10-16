"use client"

import { useState, useCallback } from 'react'

interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maintainAspectRatio?: boolean
}

interface OptimizedImage {
  file: File
  url: string
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  dimensions: {
    original: { width: number; height: number }
    optimized: { width: number; height: number }
  }
}

interface UseImageOptimizationReturn {
  optimizeImage: (file: File, options?: ImageOptimizationOptions) => Promise<OptimizedImage | null>
  batchOptimize: (files: File[], options?: ImageOptimizationOptions) => Promise<OptimizedImage[]>
  isOptimizing: boolean
  error: string | null
}

export function useImageOptimization(): UseImageOptimizationReturn {
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

  const optimizeImage = useCallback(async (
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage | null> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        format = 'jpeg',
        maintainAspectRatio = true
      } = options

      // Crear imagen
      const img = new Image()
      const imageUrl = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      // Calcular nuevas dimensiones
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        maxWidth,
        maxHeight,
        maintainAspectRatio
      )

      // Crear canvas
      const canvas = createCanvas(newWidth, newHeight)
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto del canvas')
      }

      // Dibujar imagen optimizada
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      // Convertir a blob
      const mimeType = `image/${format}`
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, mimeType, quality)
      })

      // Crear archivo optimizado
      const optimizedFile = new File([blob], file.name, {
        type: mimeType,
        lastModified: Date.now()
      })

      // Calcular métricas
      const originalSize = file.size
      const optimizedSize = optimizedFile.size
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

      // Limpiar URL
      URL.revokeObjectURL(imageUrl)

      return {
        file: optimizedFile,
        url: URL.createObjectURL(optimizedFile),
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions: {
          original: { width: img.naturalWidth, height: img.naturalHeight },
          optimized: { width: newWidth, height: newHeight }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar imagen'
      setError(errorMessage)
      console.error('[useImageOptimization] Error:', err)
      return null
    } finally {
      setIsOptimizing(false)
    }
  }, [])

  const batchOptimize = useCallback(async (
    files: File[],
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage[]> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const results: OptimizedImage[] = []
      
      for (const file of files) {
        const result = await optimizeImage(file, options)
        if (result) {
          results.push(result)
        }
      }

      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar imágenes'
      setError(errorMessage)
      console.error('[useImageOptimization] Batch error:', err)
      return []
    } finally {
      setIsOptimizing(false)
    }
  }, [optimizeImage])

  return {
    optimizeImage,
    batchOptimize,
    isOptimizing,
    error,
  }
}

// Hook para detectar si un archivo es una imagen
export function useImageDetection() {
  const isImageFile = useCallback((file: File): boolean => {
    return file.type.startsWith('image/')
  }, [])

  const getImageType = useCallback((file: File): string | null => {
    if (!isImageFile(file)) return null
    return file.type.split('/')[1]?.toLowerCase() || null
  }, [isImageFile])

  const isSupportedImageType = useCallback((file: File): boolean => {
    const imageType = getImageType(file)
    return imageType ? ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(imageType) : false
  }, [getImageType])

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!isImageFile(file)) {
        resolve(null)
        return
      }

      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }

      img.src = url
    })
  }, [isImageFile])

  return {
    isImageFile,
    getImageType,
    isSupportedImageType,
    getImageDimensions,
  }
}

// Hook para generar thumbnails
export function useThumbnailGeneration() {
  const generateThumbnail = useCallback(async (
    file: File,
    size: number = 150
  ): Promise<string | null> => {
    try {
      const img = new Image()
      const imageUrl = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null

      // Calcular dimensiones del thumbnail manteniendo aspect ratio
      const aspectRatio = img.naturalWidth / img.naturalHeight
      let thumbnailWidth = size
      let thumbnailHeight = size

      if (aspectRatio > 1) {
        thumbnailHeight = size / aspectRatio
      } else {
        thumbnailWidth = size * aspectRatio
      }

      canvas.width = thumbnailWidth
      canvas.height = thumbnailHeight

      ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight)
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
      URL.revokeObjectURL(imageUrl)
      
      return thumbnailUrl
    } catch (error) {
      console.error('[useThumbnailGeneration] Error:', error)
      return null
    }
  }, [])

  return {
    generateThumbnail,
  }
}
