"use client"

import { useState, useCallback } from 'react'

interface AudioOptimizationOptions {
  quality?: number
  bitrate?: number
  sampleRate?: number
  channels?: number
  format?: 'mp3' | 'ogg' | 'wav'
  removeMetadata?: boolean
}

interface OptimizedAudio {
  file: File
  url: string
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  metadata: {
    original: any
    optimized: any
  }
  duration: number
  bitrate: number
}

interface UseAudioOptimizationReturn {
  optimizeAudio: (file: File, options?: AudioOptimizationOptions) => Promise<OptimizedAudio | null>
  batchOptimize: (files: File[], options?: AudioOptimizationOptions) => Promise<OptimizedAudio[]>
  isOptimizing: boolean
  error: string | null
}

export function useAudioOptimization(): UseAudioOptimizationReturn {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optimizeAudio = useCallback(async (
    file: File,
    options: AudioOptimizationOptions = {}
  ): Promise<OptimizedAudio | null> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const {
        quality = 0.8,
        bitrate = 128, // kbps
        sampleRate = 44100, // Hz
        channels = 2,
        format = 'mp3',
        removeMetadata = true
      } = options

      // Para audio, la optimización real requeriría librerías como lamejs, etc.
      // Por ahora, simulamos la optimización basada en el tipo de archivo
      let compressionFactor = 1

      if (file.type.includes('mp3')) {
        // MP3: optimización de bitrate y calidad
        compressionFactor = quality * (bitrate / 320) // 320 kbps es calidad máxima
      } else if (file.type.includes('wav')) {
        // WAV: conversión a MP3 con compresión
        compressionFactor = quality * 0.1 // WAV a MP3 es mucha compresión
      } else if (file.type.includes('ogg')) {
        // OGG: optimización de calidad
        compressionFactor = quality * 0.8
      } else if (file.type.includes('flac')) {
        // FLAC: conversión a MP3 con compresión
        compressionFactor = quality * 0.2 // FLAC a MP3 es mucha compresión
      } else {
        // Otros formatos: compresión básica
        compressionFactor = quality * 0.7
      }

      // Aplicar factor de compresión según la calidad
      compressionFactor = Math.max(0.1, compressionFactor) // Mínimo 10% del tamaño original

      // Simular optimización creando un blob reducido
      const optimizedBlob = await new Promise<Blob>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          // En un entorno real, aquí se usaría una librería como lamejs para MP3
          // o Web Audio API para otros formatos
          const optimizedSize = Math.round(file.size * compressionFactor)
          const optimizedData = new Uint8Array(optimizedSize)
          const blob = new Blob([optimizedData], { type: `audio/${format}` })
          resolve(blob)
        }
        reader.readAsArrayBuffer(file)
      })

      // Crear archivo optimizado
      const optimizedFile = new File([optimizedBlob], file.name, {
        type: `audio/${format}`,
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
          optimized: { size: optimizedSize, type: `audio/${format}` }
        },
        duration: 0, // Se calcularía con Web Audio API
        bitrate: bitrate
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar audio'
      setError(errorMessage)
      console.error('[useAudioOptimization] Error:', err)
      return null
    } finally {
      setIsOptimizing(false)
    }
  }, [])

  const batchOptimize = useCallback(async (
    files: File[],
    options: AudioOptimizationOptions = {}
  ): Promise<OptimizedAudio[]> => {
    setIsOptimizing(true)
    setError(null)

    try {
      const results: OptimizedAudio[] = []
      
      for (const file of files) {
        const result = await optimizeAudio(file, options)
        if (result) {
          results.push(result)
        }
      }

      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al optimizar audios'
      setError(errorMessage)
      console.error('[useAudioOptimization] Batch error:', err)
      return []
    } finally {
      setIsOptimizing(false)
    }
  }, [optimizeAudio])

  return {
    optimizeAudio,
    batchOptimize,
    isOptimizing,
    error,
  }
}

// Hook para detectar si un archivo es un audio
export function useAudioDetection() {
  const isAudioFile = useCallback((file: File): boolean => {
    return file.type.startsWith('audio/')
  }, [])

  const getAudioType = useCallback((file: File): string | null => {
    if (!isAudioFile(file)) return null
    return file.type.split('/')[1]?.toLowerCase() || null
  }, [isAudioFile])

  const isSupportedAudioType = useCallback((file: File): boolean => {
    const audioType = getAudioType(file)
    return audioType ? ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(audioType) : false
  }, [getAudioType])

  const getAudioMetadata = useCallback(async (file: File): Promise<{
    duration: number
    bitrate: number
    sampleRate: number
    channels: number
    format: string
  } | null> => {
    return new Promise((resolve) => {
      if (!isAudioFile(file)) {
        resolve(null)
        return
      }

      const audio = document.createElement('audio')
      const url = URL.createObjectURL(file)

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve({
          duration: audio.duration,
          bitrate: Math.round((file.size * 8) / audio.duration / 1000), // kbps estimado
          sampleRate: 44100, // Valor por defecto
          channels: 2, // Valor por defecto
          format: getAudioType(file) || 'unknown'
        })
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }

      audio.src = url
    })
  }, [isAudioFile, getAudioType])

  return {
    isAudioFile,
    getAudioType,
    isSupportedAudioType,
    getAudioMetadata,
  }
}

// Hook para generar waveforms de audio
export function useAudioWaveformGeneration() {
  const generateWaveform = useCallback(async (
    file: File,
    samples: number = 100
  ): Promise<number[] | null> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      const channelData = audioBuffer.getChannelData(0)
      const blockSize = Math.floor(channelData.length / samples)
      const waveform: number[] = []
      
      for (let i = 0; i < samples; i++) {
        const start = i * blockSize
        const end = start + blockSize
        let sum = 0
        
        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j])
        }
        
        waveform.push(sum / blockSize)
      }
      
      audioContext.close()
      return waveform
    } catch (error) {
      console.error('[useAudioWaveformGeneration] Error:', error)
      return null
    }
  }, [])

  const generateWaveformImage = useCallback(async (
    file: File,
    width: number = 200,
    height: number = 50
  ): Promise<string | null> => {
    try {
      const waveform = await generateWaveform(file, width / 2)
      if (!waveform) return null

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null

      canvas.width = width
      canvas.height = height

      // Dibujar fondo
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, width, height)

      // Dibujar waveform
      ctx.fillStyle = '#3b82f6'
      const barWidth = width / waveform.length
      
      waveform.forEach((amplitude, index) => {
        const barHeight = amplitude * height
        const x = index * barWidth
        const y = (height - barHeight) / 2
        
        ctx.fillRect(x, y, barWidth - 1, barHeight)
      })

      return canvas.toDataURL('image/png', 0.8)
    } catch (error) {
      console.error('[useAudioWaveformGeneration] Error:', error)
      return null
    }
  }, [generateWaveform])

  return {
    generateWaveform,
    generateWaveformImage,
  }
}

// Hook para análisis de audio
export function useAudioAnalysis() {
  const analyzeAudio = useCallback(async (file: File): Promise<{
    duration: number
    bitrate: number
    sampleRate: number
    channels: number
    format: string
    size: number
    quality: 'low' | 'medium' | 'high'
  } | null> => {
    try {
      const audio = document.createElement('audio')
      const url = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve
        audio.onerror = reject
        audio.src = url
      })

      const duration = audio.duration
      const bitrate = Math.round((file.size * 8) / duration / 1000) // kbps
      const format = file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
      
      // Determinar calidad basada en bitrate
      let quality: 'low' | 'medium' | 'high' = 'low'
      if (bitrate >= 192) quality = 'high'
      else if (bitrate >= 128) quality = 'medium'

      URL.revokeObjectURL(url)

      return {
        duration,
        bitrate,
        sampleRate: 44100, // Valor por defecto
        channels: 2, // Valor por defecto
        format,
        size: file.size,
        quality
      }
    } catch (error) {
      console.error('[useAudioAnalysis] Error:', error)
      return null
    }
  }, [])

  return {
    analyzeAudio,
  }
}
