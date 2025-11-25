import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'MessageHub - Centraliza tus mensajes de redes sociales',
  description: 'MessageHub te permite gestionar todos tus mensajes de WhatsApp, Instagram, Facebook, TikTok y más desde una sola plataforma.',
  generator: 'MessageHub',
  openGraph: {
    title: 'MessageHub - Centraliza tus mensajes de redes sociales',
    description: 'MessageHub te permite gestionar todos tus mensajes de WhatsApp, Instagram, Facebook, TikTok y más desde una sola plataforma.',
    url: process.env.NEXTAUTH_URL || 'https://inbox.importcbamayorista.com',
    siteName: 'MessageHub',
    images: [
      {
        url: `${process.env.NEXTAUTH_URL || 'https://inbox.importcbamayorista.com'}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'MessageHub - Centraliza tus mensajes de redes sociales',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MessageHub - Centraliza tus mensajes de redes sociales',
    description: 'MessageHub te permite gestionar todos tus mensajes de WhatsApp, Instagram, Facebook, TikTok y más desde una sola plataforma.',
    images: [`${process.env.NEXTAUTH_URL || 'https://inbox.importcbamayorista.com'}/og-image.png`],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
