"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown"
import { logout } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import type { User } from "next-auth"

interface AppHeaderProps {
  user: User
  tenantId: string
}

export function AppHeader({ user, tenantId }: AppHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div />
      <div className="flex items-center space-x-2">
        <NotificationsDropdown />
        <ThemeToggle />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback>{user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/app/select-tenant")}>Cambiar empresa</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/app/${tenantId}/settings`)}>Configuración</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
