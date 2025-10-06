"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Inbox, BarChart3, Users, Settings, Building2, Radio } from "lucide-react"

interface AppSidebarProps {
  tenantId: string
  userRole: string
}

export function AppSidebar({ tenantId, userRole }: AppSidebarProps) {
  const pathname = usePathname()

  const links = [
    { href: `/app/${tenantId}/inbox`, label: "Bandeja", icon: Inbox },
    { href: `/app/${tenantId}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `/app/${tenantId}/contacts`, label: "Contactos", icon: Users },
    { href: `/app/${tenantId}/channels`, label: "Canales", icon: Radio, adminOnly: true },
    { href: `/app/${tenantId}/locals`, label: "Locales", icon: Building2, adminOnly: true },
    { href: `/app/${tenantId}/settings`, label: "Configuración", icon: Settings, adminOnly: true },
  ]

  const isAdmin = userRole === "OWNER" || userRole === "ADMIN"

  return (
    <div className="flex w-64 flex-col border-r bg-muted/30">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">MessageHub</h2>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {links.map((link) => {
          if (link.adminOnly && !isAdmin) return null

          const isActive = pathname.startsWith(link.href)
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
