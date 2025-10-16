"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, Smile, Zap, X, File, Image, Video, Music } from "lucide-react"
import { sendMessage } from "@/app/actions/messages"
import { useRouter } from "next/navigation"
import { QuickRepliesPopover } from "@/components/inbox/quick-replies-popover"
import { toast } from "sonner"
import { useStorage } from "@/hooks/use-storage"
import { UploadProgress } from "@/components/ui/progress-bar"
import { ImagePreview, ImageGallery } from "@/components/ui/image-preview"
import { VideoPreview, VideoGallery } from "@/components/ui/video-preview"
import { DocumentPreview, DocumentGallery } from "@/components/ui/document-preview"
import { AudioPreview, AudioGallery } from "@/components/ui/audio-preview"
import { ImageGalleryTrigger } from "@/components/inbox/image-gallery-modal"
import { VideoPlayerTrigger } from "@/components/inbox/video-player-modal"
import { useImageOptimization, useImageDetection } from "@/hooks/use-image-optimization"
import { useVideoOptimization, useVideoDetection } from "@/hooks/use-video-optimization"
import { useDocumentOptimization, useDocumentDetection } from "@/hooks/use-document-optimization"
import { useAudioOptimization, useAudioDetection } from "@/hooks/use-audio-optimization"

interface Attachment {
  id: string
  file: File
  name: string
  size: number
  type: string
  url?: string
  storageFile?: {
    id: string
    url: string
    publicId?: string
    key?: string
  }
}

interface MessageComposerProps {
  threadId: string
  channelId: string
  tenantId: string
  userId: string
}

export function MessageComposer({ threadId, channelId, tenantId, userId }: MessageComposerProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, uploading: storageUploading, error: storageError, uploadProgress, clearProgress } = useStorage()
  const { optimizeImage, isOptimizing: imageOptimizing } = useImageOptimization()
  const { isImageFile, isSupportedImageType } = useImageDetection()
  const { optimizeVideo, isOptimizing: videoOptimizing } = useVideoOptimization()
  const { isVideoFile, isSupportedVideoType } = useVideoDetection()
  const { optimizeDocument, isOptimizing: documentOptimizing } = useDocumentOptimization()
  const { isDocumentFile, isSupportedDocumentType } = useDocumentDetection()
  const { optimizeAudio, isOptimizing: audioOptimizing } = useAudioOptimization()
  const { isAudioFile, isSupportedAudioType } = useAudioDetection()
  
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)

  // Función para manejar la selección de archivos
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploading(true)
    
    try {
      const newAttachments: Attachment[] = []
      
      for (const file of Array.from(files)) {
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`El archivo ${file.name} es demasiado grande (máximo 10MB)`)
          continue
        }

        // Validar tipo de archivo
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/quicktime', 'video/x-msvideo',
          'audio/mpeg', 'audio/wav', 'audio/ogg',
          'application/pdf', 'text/plain',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]

        if (!allowedTypes.includes(file.type)) {
          toast.error(`El tipo de archivo ${file.type} no está permitido`)
          continue
        }

        // Optimizar archivo según su tipo
        let finalFile = file
        let optimizedUrl = URL.createObjectURL(file)
        
        if (isImageFile(file) && isSupportedImageType(file)) {
          const optimized = await optimizeImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'jpeg'
          })
          
          if (optimized) {
            finalFile = optimized.file
            optimizedUrl = optimized.url
            toast.success(`${file.name} optimizado (${Math.round(optimized.compressionRatio)}% reducción)`)
          }
        } else if (isVideoFile(file) && isSupportedVideoType(file)) {
          const optimized = await optimizeVideo(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            bitrate: 2000000, // 2 Mbps
            fps: 30,
            format: 'mp4'
          })
          
          if (optimized) {
            finalFile = optimized.file
            optimizedUrl = optimized.url
            toast.success(`${file.name} optimizado (${Math.round(optimized.compressionRatio)}% reducción)`)
          }
        } else if (isDocumentFile(file) && isSupportedDocumentType(file)) {
          const optimized = await optimizeDocument(file, {
            quality: 0.8,
            compression: 'medium',
            removeMetadata: true,
            optimizeImages: true
          })
          
          if (optimized) {
            finalFile = optimized.file
            optimizedUrl = optimized.url
            toast.success(`${file.name} optimizado (${Math.round(optimized.compressionRatio)}% reducción)`)
          }
        } else if (isAudioFile(file) && isSupportedAudioType(file)) {
          const optimized = await optimizeAudio(file, {
            quality: 0.8,
            bitrate: 128, // 128 kbps
            sampleRate: 44100,
            channels: 2,
            format: 'mp3',
            removeMetadata: true
          })
          
          if (optimized) {
            finalFile = optimized.file
            optimizedUrl = optimized.url
            toast.success(`${file.name} optimizado (${Math.round(optimized.compressionRatio)}% reducción)`)
          }
        }

        // Subir archivo al storage
        const storageFile = await uploadFile(finalFile, {
          folder: `messagehub/${tenantId}`,
          public: true
        })

        if (!storageFile) {
          toast.error(`Error al subir ${file.name}`)
          continue
        }

        const attachment: Attachment = {
          id: Math.random().toString(36).substr(2, 9),
          file: finalFile,
          name: file.name,
          size: finalFile.size,
          type: finalFile.type,
          url: optimizedUrl,
          storageFile: {
            id: storageFile.id,
            url: storageFile.url,
            publicId: storageFile.publicId,
            key: storageFile.key
          }
        }

        newAttachments.push(attachment)
      }

      if (newAttachments.length > 0) {
        setAttachments(prev => [...prev, ...newAttachments])
        toast.success(`${newAttachments.length} archivo(s) subido(s) exitosamente`)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Error al subir archivos')
    } finally {
      setUploading(false)
      
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Función para remover un adjunto
  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id)
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url)
      }
      return prev.filter(a => a.id !== id)
    })
  }

  // Función para obtener el icono del tipo de archivo
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async function handleSend() {
    if ((!message.trim() && attachments.length === 0) || sending) return

    setSending(true)
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("threadId", threadId)
      formData.append("channelId", channelId)
      formData.append("body", message)

      // Agregar adjuntos al FormData
      if (attachments.length > 0) {
        formData.append("attachments", JSON.stringify(attachments.map(a => ({
          name: a.name,
          size: a.size,
          type: a.type,
          storageFile: a.storageFile
        }))))
      }

      const result = await sendMessage(formData)

      if (result.success) {
        setMessage("")
        setAttachments([])
        router.refresh()
        toast.success("Mensaje enviado exitosamente")
      } else {
        toast.error(result.error || "Error al enviar mensaje")
      }
    } catch (error) {
      toast.error("Error al enviar mensaje")
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Función para abrir el selector de archivos
  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="border-t p-4">
      {/* Input de archivos oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Progress bar de upload */}
      {uploadProgress.length > 0 && (
        <div className="mb-3 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Subiendo archivos...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearProgress}
              className="h-6 px-2 text-xs"
            >
              Limpiar
            </Button>
          </div>
          <UploadProgress files={uploadProgress} />
        </div>
      )}

      {/* Preview de adjuntos */}
      {attachments.length > 0 && (
        <div className="mb-3 p-3 bg-muted rounded-lg">
          {/* Separar por tipo de archivo */}
          {(() => {
            const images = attachments.filter(att => isImageFile(att.file))
            const videos = attachments.filter(att => isVideoFile(att.file))
            const documents = attachments.filter(att => isDocumentFile(att.file))
            const audios = attachments.filter(att => isAudioFile(att.file))
            const otherFiles = attachments.filter(att => !isImageFile(att.file) && !isVideoFile(att.file) && !isDocumentFile(att.file) && !isAudioFile(att.file))
            
            return (
              <div className="space-y-3">
                {/* Galería de imágenes */}
                {images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Imágenes ({images.length})</h4>
                    <ImageGalleryTrigger
                      images={images.map(img => ({
                        id: img.id,
                        src: img.url || '',
                        name: img.name,
                        size: img.size,
                        type: img.type,
                        thumbnail: img.url
                      }))}
                      onDownload={(imageId) => {
                        const image = images.find(img => img.id === imageId)
                        if (image) {
                          const link = document.createElement('a')
                          link.href = image.url || ''
                          link.download = image.name
                          link.click()
                        }
                      }}
                      onShare={(imageId) => {
                        const image = images.find(img => img.id === imageId)
                        if (image && navigator.share) {
                          navigator.share({
                            title: image.name,
                            url: image.url || ''
                          })
                        }
                      }}
                      className="grid grid-cols-2 md:grid-cols-4 gap-2"
                    />
                  </div>
                )}

                {/* Galería de videos */}
                {videos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Videos ({videos.length})</h4>
                    <VideoPlayerTrigger
                      videos={videos.map(vid => ({
                        id: vid.id,
                        src: vid.url || '',
                        name: vid.name,
                        size: vid.size,
                        type: vid.type,
                        poster: vid.url // Usar la URL como poster por ahora
                      }))}
                      onDownload={(videoId) => {
                        const video = videos.find(vid => vid.id === videoId)
                        if (video) {
                          const link = document.createElement('a')
                          link.href = video.url || ''
                          link.download = video.name
                          link.click()
                        }
                      }}
                      onShare={(videoId) => {
                        const video = videos.find(vid => vid.id === videoId)
                        if (video && navigator.share) {
                          navigator.share({
                            title: video.name,
                            url: video.url || ''
                          })
                        }
                      }}
                      className="grid grid-cols-2 md:grid-cols-4 gap-2"
                    />
                  </div>
                )}

                {/* Galería de documentos */}
                {documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Documentos ({documents.length})</h4>
                    <DocumentGallery
                      documents={documents.map(doc => ({
                        id: doc.id,
                        src: doc.url || '',
                        name: doc.name,
                        size: doc.size,
                        type: doc.type
                      }))}
                      onRemove={removeAttachment}
                      maxDocuments={6}
                    />
                  </div>
                )}

                {/* Galería de audio */}
                {audios.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Audio ({audios.length})</h4>
                    <AudioGallery
                      audios={audios.map(audio => ({
                        id: audio.id,
                        src: audio.url || '',
                        name: audio.name,
                        size: audio.size,
                        type: audio.type
                      }))}
                      onRemove={removeAttachment}
                      maxAudios={4}
                    />
                  </div>
                )}
                
                {/* Otros archivos */}
                {otherFiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Archivos ({otherFiles.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {otherFiles.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 bg-background rounded-md p-2 border">
                          {getFileIcon(attachment.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(attachment.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] resize-none"
          disabled={sending}
        />
        <div className="flex flex-col gap-2">
          <QuickRepliesPopover
            tenantId={tenantId}
            onSelect={(content) => setMessage(content)}
          >
            <Button variant="ghost" size="icon" disabled={sending} title="Respuestas rápidas">
              <Zap className="h-4 w-4" />
            </Button>
          </QuickRepliesPopover>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={sending}
            onClick={handleAttachClick}
            title="Adjuntar archivos"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={sending} title="Emojis">
            <Smile className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={(!message.trim() && attachments.length === 0) || sending || uploading || storageUploading || imageOptimizing || videoOptimizing || documentOptimizing || audioOptimizing}
            title={uploading || storageUploading || imageOptimizing || videoOptimizing || documentOptimizing || audioOptimizing ? "Procesando..." : "Enviar mensaje"}
          >
            {uploading || storageUploading || imageOptimizing || videoOptimizing || documentOptimizing || audioOptimizing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
