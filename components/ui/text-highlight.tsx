"use client"

import { useMemo } from "react"

interface TextHighlightProps {
  text: string
  searchTerm: string
  className?: string
  highlightClassName?: string
}

export function TextHighlight({ 
  text, 
  searchTerm, 
  className = "",
  highlightClassName = "bg-yellow-200 dark:bg-yellow-800 font-medium"
}: TextHighlightProps) {
  const highlightedText = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) {
      return <span className={className}>{text}</span>
    }

    // Escapar caracteres especiales de regex
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')
    const parts = text.split(regex)

    return (
      <span className={className}>
        {parts.map((part, index) => {
          // Verificar si esta parte es una coincidencia
          const isMatch = regex.test(part)
          regex.lastIndex = 0 // Reset regex para la siguiente verificación
          
          return isMatch ? (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        })}
      </span>
    )
  }, [text, searchTerm, className, highlightClassName])

  return highlightedText
}

// Hook para obtener el texto destacado como string HTML (para casos especiales)
export function useTextHighlight(text: string, searchTerm: string) {
  return useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) {
      return text
    }

    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')
    
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 font-medium">$1</mark>')
  }, [text, searchTerm])
}
