import { NextApiRequest, NextApiResponse } from 'next'
import { Server as NetServer } from 'http'
import { initializeSocket } from '@/lib/socket'

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  // Verificar si ya está inicializado
  if ((res.socket as any)?.server?.io) {
    console.log('[Socket.IO] Socket ya está inicializado')
    res.end()
    return
  }

  console.log('[Socket.IO] Inicializando Socket.IO...')
  
  const httpServer: NetServer = (res.socket as any)?.server
  if (!httpServer) {
    res.status(500).json({ error: 'No se pudo inicializar el servidor' })
    return
  }
  
  const io = initializeSocket(httpServer)
  
  // Guardar la instancia en el servidor
  if ((res.socket as any)?.server) {
    (res.socket as any).server.io = io
  }
  
  res.end()
}

export default SocketHandler
