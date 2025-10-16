"use client"

import { useState, useCallback } from 'react'
import { StorageFile, UploadOptions } from '@/lib/storage/types'

interface UploadProgress {
  id: string
  name: string
  progress: number
  status: "uploading" | "completed" | "error"
  error?: string
}

interface UseStorageReturn {
  uploadFile: (file: File, options?: UploadOptions) => Promise<StorageFile | null>
  deleteFile: (fileId: string) => Promise<boolean>
  getFileUrl: (fileId: string) => Promise<string>
  uploading: boolean
  error: string | null
  uploadProgress: UploadProgress[]
  clearProgress: () => void
}

export function useStorage(): UseStorageReturn {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])

  const uploadFile = useCallback(async (file: File, options?: UploadOptions): Promise<StorageFile | null> => {
    const fileId = Math.random().toString(36).substr(2, 9)
    
    setUploading(true)
    setError(null)

    // Agregar archivo al progreso
    setUploadProgress(prev => [...prev, {
      id: fileId,
      name: file.name,
      progress: 0,
      status: "uploading"
    }])

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options) {
        formData.append('options', JSON.stringify(options))
      }

      // Simular progreso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev.map(p => 
          p.id === fileId 
            ? { ...p, progress: Math.min(p.progress + Math.random() * 20, 90) }
            : p
        ))
      }, 200)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // Marcar como completado
      setUploadProgress(prev => prev.map(p => 
        p.id === fileId 
          ? { ...p, progress: 100, status: "completed" as const }
          : p
      ))

      return result.file
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      
      // Marcar como error
      setUploadProgress(prev => prev.map(p => 
        p.id === fileId 
          ? { ...p, status: "error" as const, error: errorMessage }
          : p
      ))
      
      console.error('[useStorage] Upload error:', err)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/storage/delete/${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.success
    } catch (err) {
      console.error('[useStorage] Delete error:', err)
      return false
    }
  }, [])

  const getFileUrl = useCallback(async (fileId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/storage/url/${fileId}`)
      
      if (!response.ok) {
        throw new Error(`Get URL failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.url || ''
    } catch (err) {
      console.error('[useStorage] Get URL error:', err)
      return ''
    }
  }, [])

  const clearProgress = useCallback(() => {
    setUploadProgress([])
  }, [])

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    uploading,
    error,
    uploadProgress,
    clearProgress,
  }
}
