"use client"

import { useState, useCallback } from 'react'
import { StorageFile, UploadOptions } from '@/lib/storage/types'

interface UseStorageReturn {
  uploadFile: (file: File, options?: UploadOptions) => Promise<StorageFile | null>
  deleteFile: (fileId: string) => Promise<boolean>
  getFileUrl: (fileId: string) => Promise<string>
  uploading: boolean
  error: string | null
}

export function useStorage(): UseStorageReturn {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File, options?: UploadOptions): Promise<StorageFile | null> => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options) {
        formData.append('options', JSON.stringify(options))
      }

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      return result.file
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
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

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    uploading,
    error,
  }
}
