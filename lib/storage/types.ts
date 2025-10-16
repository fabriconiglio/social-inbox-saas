// Tipos para el sistema de storage

export interface StorageFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  publicId?: string // Para Cloudinary
  key?: string // Para S3
  uploadedAt: Date
  metadata?: Record<string, any>
}

export interface UploadResult {
  success: boolean
  file?: StorageFile
  error?: string
}

export interface UploadOptions {
  folder?: string
  public?: boolean
  transformation?: {
    width?: number
    height?: number
    quality?: number
    format?: string
  }
  metadata?: Record<string, any>
}

export interface StorageProvider {
  name: string
  upload(file: File, options?: UploadOptions): Promise<UploadResult>
  delete(fileId: string): Promise<boolean>
  getUrl(fileId: string): Promise<string>
  list(folder?: string): Promise<StorageFile[]>
}

export interface StorageConfig {
  provider: 'cloudinary' | 's3' | 'local'
  credentials: {
    cloudinary?: {
      cloudName: string
      apiKey: string
      apiSecret: string
    }
    s3?: {
      bucket: string
      region: string
      accessKeyId: string
      secretAccessKey: string
    }
    local?: {
      uploadPath: string
      publicUrl: string
    }
  }
}
