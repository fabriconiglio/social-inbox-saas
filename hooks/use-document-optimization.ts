"use client"

import { useState, useCallback } from 'react'

interface DocumentOptimizationOptions {
  quality?: number
  compression?: 'low' | 'medium' | 'high'
  removeMetadata?: boolean
  optimizeImages?: boolean
  format?: 'pdf' | 'docx' | 'xlsx'
}

interface OptimizedDocument {
  file: File
  url: string
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  metadata: {
    original: any
    optimized: any
  }
}

interface UseDocumentOptimizationReturn {
  optimizeDocument: (file: File, options?: DocumentOptimizationOptions) => Promise<OptimizedDocument | null>
  batchOptimize: (files: File[], options?: DocumentOptimizationOptions) => Promise<OptimizedDocument[]>
  isOptimizing: boolean
  error: string | null
}

export function useDocumentOptimization(): UseDocumentOptimizationReturn {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optimizeDocument = useCallback(async (
    file: File,
    options: DocumentOptimizationOptions = {}
  ): Promise<OptimizedDocument | null> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const {
        quality = 0.8,
        compression = 'medium',
        removeMetadata = true,
        optimizeImages = true,
        format = 'pdf'
      } = options

      // Para documentos, la optimización real requeriría librerías especializadas
      // Por ahora, simulamos la optimización basada en el tipo de archivo
      let compressionFactor = 1

      if (file.type.includes('pdf')) {
        // PDF: optimización de imágenes embebidas y metadatos
        compressionFactor = quality * 0.7
      } else if (file.type.includes('word') || file.type.includes('document')) {
        // Word: compresión de imágenes y limpieza de metadatos
        compressionFactor = quality * 0.8
      } else if (file.type.includes('sheet') || file.type.includes('excel')) {
        // Excel: optimización de fórmulas y datos
        compressionFactor = quality * 0.9
      } else {
        // Otros documentos: compresión básica
        compressionFactor = quality * 0.85
      }

      // Aplicar factor de compresión según el nivel
      switch (compression) {
        case 'low':
          compressionFactor *= 0.9
          break
        case 'medium':
          compressionFactor *= 0.7
          break
        case 'high':
          compressionFactor *= 0.5
          break
      }

      // Simular optimización creando un blob reducido
      const optimizedBlob = await new Promise<Blob>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          // En un entorno real, aquí se usaría una librería como PDF-lib, mammoth, etc.
          // Por ahora, simulamos la reducción de tamaño
          const optimizedSize = Math.round(file.size * compressionFactor)
          const optimizedData = new Uint8Array(optimizedSize)
          const blob = new Blob([optimizedData], { type: file.type })
          resolve(blob)
        }
        reader.readAsArrayBuffer(file)
      })

      // Crear archivo optimizado
      const optimizedFile = new File([optimizedBlob], file.name, {
        type: file.type,
        lastModified: Date.now()
      })

      // Calcular métricas
      const originalSize = file.size
      const optimizedSize = optimizedFile.size
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

      return {
        file: optimizedFile,
        url: URL.createObjectURL(optimizedFile),
        originalSize,
        optimizedSize,
        compressionRatio,
        metadata: {
          original: { size: originalSize, type: file.type },
          optimized: { size: optimizedSize, type: file.type }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar documento'
      setError(errorMessage)
      console.error('[useDocumentOptimization] Error:', err)
      return null
    } finally {
      setIsOptimizing(false)
    }
  }, [])

  const batchOptimize = useCallback(async (
    files: File[],
    options: DocumentOptimizationOptions = {}
  ): Promise<OptimizedDocument[]> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const results: OptimizedDocument[] = []
      
      for (const file of files) {
        const result = await optimizeDocument(file, options)
        if (result) {
          results.push(result)
        }
      }

      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar documentos'
      setError(errorMessage)
      console.error('[useDocumentOptimization] Batch error:', err)
      return []
    } finally {
      setIsOptimizing(false)
    }
  }, [optimizeDocument])

  return {
    optimizeDocument,
    batchOptimize,
    isOptimizing,
    error,
  }
}

// Hook para detectar si un archivo es un documento
export function useDocumentDetection() {
  const isDocumentFile = useCallback((file: File): boolean => {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/rtf'
    ]
    return documentTypes.includes(file.type)
  }, [])

  const getDocumentType = useCallback((file: File): string | null => {
    if (!isDocumentFile(file)) return null
    
    if (file.type.includes('pdf')) return 'pdf'
    if (file.type.includes('word')) return 'word'
    if (file.type.includes('sheet') || file.type.includes('excel')) return 'excel'
    if (file.type.includes('presentation') || file.type.includes('powerpoint')) return 'powerpoint'
    if (file.type.includes('text')) return 'text'
    return 'document'
  }, [isDocumentFile])

  const isSupportedDocumentType = useCallback((file: File): boolean => {
    const documentType = getDocumentType(file)
    return documentType ? ['pdf', 'word', 'excel', 'powerpoint', 'text'].includes(documentType) : false
  }, [getDocumentType])

  const getDocumentMetadata = useCallback(async (file: File): Promise<{
    type: string
    size: number
    name: string
    lastModified: Date
  } | null> => {
    if (!isDocumentFile(file)) return null

    return {
      type: getDocumentType(file) || 'document',
      size: file.size,
      name: file.name,
      lastModified: new Date(file.lastModified)
    }
  }, [isDocumentFile, getDocumentType])

  return {
    isDocumentFile,
    getDocumentType,
    isSupportedDocumentType,
    getDocumentMetadata,
  }
}

// Hook para generar thumbnails de documentos
export function useDocumentThumbnailGeneration() {
  const generateThumbnail = useCallback(async (
    file: File
  ): Promise<string | null> => {
    try {
      // Para documentos, generar un thumbnail es complejo
      // Por ahora, retornamos un icono representativo
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null

      canvas.width = 200
      canvas.height = 200

      // Dibujar fondo
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dibujar icono según tipo
      ctx.fillStyle = '#6b7280'
      ctx.font = '48px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      let icon = '📄'
      if (file.type.includes('pdf')) icon = '📕'
      else if (file.type.includes('word')) icon = '📘'
      else if (file.type.includes('excel')) icon = '📗'
      else if (file.type.includes('powerpoint')) icon = '📙'
      
      ctx.fillText(icon, canvas.width / 2, canvas.height / 2 - 20)
      
      // Dibujar nombre del archivo
      ctx.font = '12px Arial'
      ctx.fillStyle = '#374151'
      const name = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name
      ctx.fillText(name, canvas.width / 2, canvas.height / 2 + 20)
      
      return canvas.toDataURL('image/png', 0.8)
    } catch (error) {
      console.error('[useDocumentThumbnailGeneration] Error:', error)
      return null
    }
  }, [])

  return {
    generateThumbnail,
  }
}

// Hook para extraer texto de documentos
export function useDocumentTextExtraction() {
  const extractText = useCallback(async (file: File): Promise<string | null> => {
    try {
      if (file.type.includes('pdf')) {
        // Para PDF, se necesitaría pdf-parse o similar
        // Por ahora, simulamos extracción
        return 'Texto extraído del PDF...'
      } else if (file.type.includes('word')) {
        // Para Word, se necesitaría mammoth.js
        return 'Texto extraído del documento Word...'
      } else if (file.type.includes('text')) {
        // Para archivos de texto, leer directamente
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve(e.target?.result as string || null)
          }
          reader.readAsText(file)
        })
      }
      
      return null
    } catch (error) {
      console.error('[useDocumentTextExtraction] Error:', error)
      return null
    }
  }, [])

  return {
    extractText,
  }
}
