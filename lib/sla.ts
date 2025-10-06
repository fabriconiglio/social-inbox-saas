import { differenceInMinutes } from "date-fns"
import type { Thread, Message } from "@prisma/client"

export interface SLAConfig {
  firstResponseMins: number
  businessHoursJSON?: any
}

export interface SLAStatus {
  status: "ok" | "warning" | "breached"
  minutesRemaining: number
  minutesElapsed: number
}

export function calculateSLA(thread: Thread & { messages: Message[] }, config: SLAConfig): SLAStatus {
  // Find first outbound message (first response)
  const firstResponse = thread.messages.find((m) => m.direction === "OUTBOUND")

  const minutesElapsed = differenceInMinutes(firstResponse?.sentAt || new Date(), thread.createdAt)

  const minutesRemaining = config.firstResponseMins - minutesElapsed

  let status: "ok" | "warning" | "breached" = "ok"

  if (!firstResponse) {
    // No response yet
    if (minutesRemaining < 0) {
      status = "breached"
    } else if (minutesRemaining < config.firstResponseMins * 0.2) {
      // Less than 20% time remaining
      status = "warning"
    }
  }

  return {
    status,
    minutesRemaining,
    minutesElapsed,
  }
}

export function getSLABadgeColor(status: "ok" | "warning" | "breached"): string {
  switch (status) {
    case "ok":
      return "bg-green-500"
    case "warning":
      return "bg-yellow-500"
    case "breached":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function formatSLATime(minutes: number): string {
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes)
    if (absMinutes < 60) {
      return `${absMinutes}m vencido`
    }
    const hours = Math.floor(absMinutes / 60)
    const mins = absMinutes % 60
    return `${hours}h ${mins}m vencido`
  }

  if (minutes < 60) {
    return `${minutes}m restantes`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m restantes`
}
