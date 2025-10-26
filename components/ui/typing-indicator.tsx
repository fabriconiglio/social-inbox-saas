"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  users: Array<{
    userId: string
    userName: string
    isTyping: boolean
  }>
  className?: string
  showNames?: boolean
  compact?: boolean
}

export function TypingIndicator({ 
  users, 
  className, 
  showNames = true, 
  compact = false 
}: TypingIndicatorProps) {
  const typingUsers = users.filter(user => user.isTyping)
  
  if (typingUsers.length === 0) {
    return null
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} está escribiendo...`
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} y ${typingUsers[1].userName} están escribiendo...`
    }
    return `${typingUsers.length} personas están escribiendo...`
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <TypingDots />
        <span className="truncate">{getTypingText()}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-muted/50 rounded-lg", className)}>
      <TypingDots />
      <div className="flex-1 min-w-0">
        {showNames ? (
          <p className="text-sm text-muted-foreground truncate">
            {getTypingText()}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Escribiendo...
          </p>
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}

// Componente para mostrar en la lista de threads
export function ThreadTypingIndicator({ 
  threadId, 
  typingUsers, 
  className 
}: {
  threadId: string
  typingUsers: Array<{
    userId: string
    userName: string
    isTyping: boolean
  }>
  className?: string
}) {
  const activeTyping = typingUsers.filter(user => user.isTyping)
  
  if (activeTyping.length === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs text-blue-600", className)}>
      <TypingDots />
      <span className="truncate">
        {activeTyping.length === 1 
          ? `${activeTyping[0].userName} escribiendo...`
          : `${activeTyping.length} escribiendo...`
        }
      </span>
    </div>
  )
}

// Componente para mostrar en el header del thread
export function ThreadHeaderTypingIndicator({ 
  typingUsers, 
  className 
}: {
  typingUsers: Array<{
    userId: string
    userName: string
    isTyping: boolean
  }>
  className?: string
}) {
  const activeTyping = typingUsers.filter(user => user.isTyping)
  
  if (activeTyping.length === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground animate-pulse", className)}>
      <TypingDots />
      <span>
        {activeTyping.length === 1 
          ? `${activeTyping[0].userName} está escribiendo...`
          : `${activeTyping.length} personas están escribiendo...`
        }
      </span>
    </div>
  )
}
