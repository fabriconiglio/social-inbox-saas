import { StorageProvider, StorageConfig, UploadResult, StorageFile, UploadOptions } from './types'

class StorageService {
  private provider: StorageProvider
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
    this.provider = this.createProvider()
  }

  private createProvider(): StorageProvider {
    switch (this.config.provider) {
      case 'cloudinary':
        return new CloudinaryProvider(this.config.credentials.cloudinary!)
      case 's3':
        return new S3Provider(this.config.credentials.s3!)
      case 'local':
        return new LocalProvider(this.config.credentials.local!)
      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`)
    }
  }

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    try {
      return await this.provider.upload(file, options)
    } catch (error) {
      console.error('[StorageService] Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      return await this.provider.delete(fileId)
    } catch (error) {
      console.error('[StorageService] Delete error:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    try {
      return await this.provider.getUrl(fileId)
    } catch (error) {
      console.error('[StorageService] Get URL error:', error)
      return ''
    }
  }

  async list(folder?: string): Promise<StorageFile[]> {
    try {
      return await this.provider.list(folder)
    } catch (error) {
      console.error('[StorageService] List error:', error)
      return []
    }
  }
}

// Cloudinary Provider
class CloudinaryProvider implements StorageProvider {
  name = 'cloudinary'
  private cloudinary: any

  constructor(credentials: { cloudName: string; apiKey: string; apiSecret: string }) {
    // Cloudinary se inicializará dinámicamente
    this.cloudinary = null
  }

  private async initCloudinary() {
    if (!this.cloudinary) {
      const { v2: cloudinary } = await import('cloudinary')
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })
      this.cloudinary = cloudinary
    }
    return this.cloudinary
  }

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    try {
      const cloudinary = await this.initCloudinary()
      
      // Convertir File a buffer
      const buffer = Buffer.from(await file.arrayBuffer())
      
      const uploadOptions: any = {
        resource_type: 'auto',
        folder: options?.folder || 'messagehub',
        public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, '')}`,
      }

      if (options?.transformation) {
        uploadOptions.transformation = options.transformation
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error: any, result: any) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      }) as any

      return {
        success: true,
        file: {
          id: result.public_id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date(),
          metadata: result
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cloudinary upload failed'
      }
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const cloudinary = await this.initCloudinary()
      const result = await cloudinary.uploader.destroy(fileId)
      return result.result === 'ok'
    } catch (error) {
      console.error('[CloudinaryProvider] Delete error:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    try {
      const cloudinary = await this.initCloudinary()
      return cloudinary.url(fileId)
    } catch (error) {
      console.error('[CloudinaryProvider] Get URL error:', error)
      return ''
    }
  }

  async list(folder?: string): Promise<StorageFile[]> {
    try {
      const cloudinary = await this.initCloudinary()
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder || 'messagehub',
        max_results: 100
      })
      
      return result.resources.map((resource: any) => ({
        id: resource.public_id,
        name: resource.original_filename,
        size: resource.bytes,
        type: resource.resource_type,
        url: resource.secure_url,
        publicId: resource.public_id,
        uploadedAt: new Date(resource.created_at),
        metadata: resource
      }))
    } catch (error) {
      console.error('[CloudinaryProvider] List error:', error)
      return []
    }
  }
}

// S3 Provider
class S3Provider implements StorageProvider {
  name = 's3'
  private s3: any

  constructor(credentials: { bucket: string; region: string; accessKeyId: string; secretAccessKey: string }) {
    // S3 se inicializará dinámicamente
    this.s3 = null
  }

  private async initS3() {
    if (!this.s3) {
      const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3')
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
      
      this.s3 = {
        client: new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        }),
        bucket: process.env.AWS_S3_BUCKET!,
        getSignedUrl
      }
    }
    return this.s3
  }

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    try {
      const s3 = await this.initS3()
      const key = `${options?.folder || 'messagehub'}/${Date.now()}_${file.name}`
      
      const buffer = Buffer.from(await file.arrayBuffer())
      
      const command = new s3.client.constructor.PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          ...options?.metadata
        }
      })

      await s3.client.send(command)
      
      const url = `https://${s3.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

      return {
        success: true,
        file: {
          id: key,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          key,
          uploadedAt: new Date(),
          metadata: { bucket: s3.bucket, region: process.env.AWS_REGION }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 upload failed'
      }
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const s3 = await this.initS3()
      const command = new s3.client.constructor.DeleteObjectCommand({
        Bucket: s3.bucket,
        Key: fileId
      })
      
      await s3.client.send(command)
      return true
    } catch (error) {
      console.error('[S3Provider] Delete error:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    try {
      const s3 = await this.initS3()
      const command = new s3.client.constructor.GetObjectCommand({
        Bucket: s3.bucket,
        Key: fileId
      })
      
      return await s3.getSignedUrl(s3.client, command, { expiresIn: 3600 })
    } catch (error) {
      console.error('[S3Provider] Get URL error:', error)
      return ''
    }
  }

  async list(folder?: string): Promise<StorageFile[]> {
    // Implementación básica - en producción se usaría ListObjectsV2Command
    return []
  }
}

// Local Provider (para desarrollo)
class LocalProvider implements StorageProvider {
  name = 'local'
  private uploadPath: string
  private publicUrl: string

  constructor(credentials: { uploadPath: string; publicUrl: string }) {
    this.uploadPath = credentials.uploadPath
    this.publicUrl = credentials.publicUrl
  }

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const fileName = `${Date.now()}_${file.name}`
      const folder = options?.folder || 'messagehub'
      const fullPath = path.join(this.uploadPath, folder, fileName)
      
      // Crear directorio si no existe
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      
      // Guardar archivo
      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(fullPath, buffer)
      
      const url = `${this.publicUrl}/${folder}/${fileName}`

      return {
        success: true,
        file: {
          id: fileName,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          uploadedAt: new Date(),
          metadata: { path: fullPath }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local upload failed'
      }
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const fullPath = path.join(this.uploadPath, fileId)
      await fs.unlink(fullPath)
      return true
    } catch (error) {
      console.error('[LocalProvider] Delete error:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    return `${this.publicUrl}/${fileId}`
  }

  async list(folder?: string): Promise<StorageFile[]> {
    // Implementación básica para desarrollo
    return []
  }
}

// Factory function para crear el servicio
export function createStorageService(config: StorageConfig): StorageService {
  return new StorageService(config)
}

// Configuración por defecto
export function getDefaultStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER as 'cloudinary' | 's3' | 'local') || 'local'
  
  return {
    provider,
    credentials: {
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      },
      s3: {
        bucket: process.env.AWS_S3_BUCKET || '',
        region: process.env.AWS_REGION || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      local: {
        uploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
        publicUrl: process.env.LOCAL_PUBLIC_URL || 'http://localhost:3000/uploads',
      }
    }
  }
}

export default StorageService
