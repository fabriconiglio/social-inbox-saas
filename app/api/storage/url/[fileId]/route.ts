import { NextRequest, NextResponse } from 'next/server'
import { createStorageService, getDefaultStorageConfig } from '@/lib/storage/storage-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Verificar autenticación
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = params

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    // Crear servicio de storage
    const config = getDefaultStorageConfig()
    const storageService = createStorageService(config)

    // Obtener URL del archivo
    const url = await storageService.getUrl(fileId)

    if (!url) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      url
    })

  } catch (error) {
    console.error('[Storage URL API] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
