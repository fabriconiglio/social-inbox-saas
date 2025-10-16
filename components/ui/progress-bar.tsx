"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  className?: string
  showPercentage?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "error"
  animated?: boolean
  striped?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showPercentage = true,
  size = "md",
  variant = "default",
  animated = false,
  striped = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }

  const variantClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-muted-foreground">
          Progreso
        </span>
        {showPercentage && (
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            variantClasses[variant],
            animated && "animate-pulse",
            striped && "bg-stripes"
          )}
          style={{
            width: `${percentage}%`,
            backgroundImage: striped
              ? "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)"
              : undefined,
            backgroundSize: striped ? "1rem 1rem" : undefined,
            animation: striped && animated
              ? "progress-stripes 1s linear infinite"
              : undefined,
          }}
        />
      </div>
    </div>
  )
}

// Componente específico para upload de archivos
interface UploadProgressProps {
  files: Array<{
    id: string
    name: string
    progress: number
    status: "uploading" | "completed" | "error"
    error?: string
  }>
  className?: string
}

export function UploadProgress({ files, className }: UploadProgressProps) {
  if (files.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      {files.map((file) => (
        <div key={file.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate flex-1 mr-2">
              {file.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {file.status === "uploading" && `${Math.round(file.progress)}%`}
              {file.status === "completed" && "✓"}
              {file.status === "error" && "✗"}
            </span>
          </div>
          
          <ProgressBar
            value={file.progress}
            variant={
              file.status === "completed"
                ? "success"
                : file.status === "error"
                ? "error"
                : "default"
            }
            animated={file.status === "uploading"}
            striped={file.status === "uploading"}
            size="sm"
            showPercentage={false}
          />
          
          {file.error && (
            <p className="text-xs text-red-500">{file.error}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// Componente para progress circular
interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
  variant?: "default" | "success" | "warning" | "error"
}

export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 4,
  className,
  showPercentage = true,
  variant = "default",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const variantClasses = {
    default: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-all duration-300 ease-in-out", variantClasses[variant])}
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium">
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}

// CSS para animaciones (se puede agregar a globals.css)
const progressStripesCSS = `
@keyframes progress-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 1rem 0;
  }
}

.bg-stripes {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}
`
