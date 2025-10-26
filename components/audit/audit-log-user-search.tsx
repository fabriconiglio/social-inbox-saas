"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  User, 
  Search, 
  X, 
  Check,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  image?: string
  role?: string
}

interface AuditLogUserSearchProps {
  onUserSelect: (user: User | null) => void
  selectedUser: User | null
  placeholder?: string
  className?: string
}

// Mock data - en producción esto vendría de una API
const MOCK_USERS: User[] = [
  {
    id: "user_1",
    name: "Juan Pérez",
    email: "juan.perez@empresa.com",
    role: "ADMIN"
  },
  {
    id: "user_2", 
    name: "María García",
    email: "maria.garcia@empresa.com",
    role: "AGENT"
  },
  {
    id: "user_3",
    name: "Carlos López",
    email: "carlos.lopez@empresa.com", 
    role: "AGENT"
  },
  {
    id: "user_4",
    name: "Ana Martínez",
    email: "ana.martinez@empresa.com",
    role: "VIEWER"
  },
  {
    id: "user_5",
    name: "Roberto Silva",
    email: "roberto.silva@empresa.com",
    role: "OWNER"
  }
]

export function AuditLogUserSearch({ 
  onUserSelect, 
  selectedUser,
  placeholder = "Buscar usuario...",
  className 
}: AuditLogUserSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return MOCK_USERS
    
    return MOCK_USERS.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const handleUserSelect = (user: User) => {
    onUserSelect(user)
    setOpen(false)
    setSearchQuery("")
  }

  const handleClear = () => {
    onUserSelect(null)
    setSearchQuery("")
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "OWNER": return "bg-red-100 text-red-800"
      case "ADMIN": return "bg-orange-100 text-orange-800"
      case "AGENT": return "bg-blue-100 text-blue-800"
      case "VIEWER": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "OWNER": return "Propietario"
      case "ADMIN": return "Administrador"
      case "AGENT": return "Agente"
      case "VIEWER": return "Visualizador"
      default: return "Usuario"
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Usuario</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUser ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="truncate">{selectedUser.name}</span>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getRoleColor(selectedUser.role))}
                >
                  {getRoleLabel(selectedUser.role)}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Search className="h-4 w-4" />
                {placeholder}
              </div>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.email}`}
                    onSelect={() => handleUserSelect(user)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <User className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{user.name}</span>
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getRoleColor(user.role))}
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Usuario seleccionado */}
      {selectedUser && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <User className="h-4 w-4" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{selectedUser.name}</span>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getRoleColor(selectedUser.role))}
              >
                {getRoleLabel(selectedUser.role)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{selectedUser.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
