"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Smile } from "lucide-react"
import { sendMessage } from "@/app/actions/messages"
import { useRouter } from "next/navigation"

interface MessageComposerProps {
  threadId: string
  channelId: string
  tenantId: string
  userId: string
}

export function MessageComposer({ threadId, channelId, tenantId, userId }: MessageComposerProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!message.trim() || sending) return

    setSending(true)
    const formData = new FormData()
    formData.append("threadId", threadId)
    formData.append("channelId", channelId)
    formData.append("body", message)

    const result = await sendMessage(formData)

    if (result.success) {
      setMessage("")
      router.refresh()
    } else {
      alert(result.error || "Error al enviar mensaje")
    }

    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] resize-none"
          disabled={sending}
        />
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="icon" disabled={sending}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={sending}>
            <Smile className="h-4 w-4" />
          </Button>
          <Button onClick={handleSend} disabled={!message.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
