import { Badge } from "@/components/ui/badge"
import { calculateSLA, getSLABadgeColor, formatSLATime } from "@/lib/sla"
import type { Thread, Message } from "@prisma/client"

interface SLABadgeProps {
  thread: Thread & { messages: Message[] }
  config?: {
    firstResponseMins: number
    businessHoursJSON?: any
  }
}

export function SLABadge({ thread, config = { firstResponseMins: 60 } }: SLABadgeProps) {
  const sla = calculateSLA(thread, config)

  return (
    <Badge variant="outline" className="gap-1">
      <div className={`h-2 w-2 rounded-full ${getSLABadgeColor(sla.status)}`} />
      <span className="text-xs">{formatSLATime(sla.minutesRemaining)}</span>
    </Badge>
  )
}
