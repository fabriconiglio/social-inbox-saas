import { NextRequest, NextResponse } from 'next/server'
import { createStorageService, getDefaultStorageConfig } from '@/lib/storage/storage-service'
import { requireAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const optionsData = formData.get('options') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parsear opciones si se proporcionan
    let options = undefined
    if (optionsData) {
      try {
        options = JSON.parse(optionsData)
      } catch (error) {
        console.error('Error parsing upload options:', error)
      }
    }

    // Crear servicio de storage
    const config = getDefaultStorageConfig()
    const storageService = createStorageService(config)

    // Subir archivo
    const result = await storageService.upload(file, {
      folder: 'messagehub',
      public: true,
      ...options
    })

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      file: result.file
    })

  } catch (error) {
    console.error('[Storage Upload API] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
