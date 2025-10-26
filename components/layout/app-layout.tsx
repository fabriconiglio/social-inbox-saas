"use client"

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { SocketProvider } from '@/contexts/socket-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

interface AppLayoutProps {
  children: ReactNode
  tenantId?: string
}

export function AppLayout({ children, tenantId }: AppLayoutProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SocketProvider tenantId={tenantId}>
          {children}
          <Toaster />
        </SocketProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
