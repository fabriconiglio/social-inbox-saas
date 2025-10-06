"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ConnectChannelDialog } from "./connect-channel-dialog"

interface ConnectChannelButtonProps {
  tenantId: string
  locals: Array<{
    id: string
    name: string
  }>
}

export function ConnectChannelButton({ tenantId, locals }: ConnectChannelButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Conectar Canal
      </Button>
      <ConnectChannelDialog
        open={open}
        onOpenChange={setOpen}
        tenantId={tenantId}
        locals={locals}
      />
    </>
  )
}
