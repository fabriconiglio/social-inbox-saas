import sharp from 'sharp'

async function generateOGImage() {
  const width = 1200
  const height = 630

  // Crear SVG con el diseño de Open Graph
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Fondo con gradiente -->
      <rect width="${width}" height="${height}" fill="url(#gradient)"/>
      
      <!-- Círculos decorativos -->
      <circle cx="100" cy="100" r="80" fill="white" opacity="0.1"/>
      <circle cx="${width - 100}" cy="${height - 100}" r="120" fill="white" opacity="0.1"/>
      <circle cx="${width - 300}" cy="150" r="60" fill="white" opacity="0.15"/>
      
      <!-- Contenedor principal -->
      <rect x="80" y="80" width="${width - 160}" height="${height - 160}" fill="white" fill-opacity="0.95" rx="24"/>
      
      <!-- Título -->
      <text x="${width / 2}" y="${height / 2 - 80}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="72" 
            font-weight="bold" 
            fill="#1e293b" 
            text-anchor="middle" 
            dominant-baseline="middle">
        MessageHub
      </text>
      
      <!-- Subtítulo -->
      <text x="${width / 2}" y="${height / 2 + 20}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="32" 
            fill="#64748b" 
            text-anchor="middle" 
            dominant-baseline="middle">
        Centraliza tus mensajes de redes sociales
      </text>
      
      <!-- Iconos de redes sociales -->
      <g transform="translate(${width / 2 - 200}, ${height / 2 + 100})">
        <!-- WhatsApp -->
        <circle cx="0" cy="0" r="35" fill="#25D366"/>
        <text x="0" y="8" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">W</text>
        
        <!-- Instagram -->
        <circle cx="100" cy="0" r="35" fill="#E4405F"/>
        <text x="100" y="8" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">I</text>
        
        <!-- Facebook -->
        <circle cx="200" cy="0" r="35" fill="#1877F2"/>
        <text x="200" y="8" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">F</text>
        
        <!-- TikTok -->
        <circle cx="300" cy="0" r="35" fill="#000000"/>
        <text x="300" y="8" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">T</text>
      </g>
    </svg>
  `

  // Convertir SVG a PNG
  const imageBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()

  // Guardar la imagen
  await sharp(imageBuffer)
    .png()
    .toFile('public/og-image.png')

  console.log('✅ Imagen de Open Graph generada exitosamente: public/og-image.png')
}

generateOGImage().catch(console.error)

