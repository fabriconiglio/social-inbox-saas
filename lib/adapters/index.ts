import type { ChannelAdapter } from "./types"
import { MetaInstagramAdapter } from "./meta-instagram-adapter"
import { MetaFacebookAdapter } from "./meta-facebook-adapter"
import { WhatsAppCloudAdapter } from "./whatsapp-cloud-adapter"
import { TikTokAdapter } from "./tiktok-adapter"
import { MockAdapter } from "./mock-adapter"

const adapters: Record<string, ChannelAdapter> = {
  instagram: new MetaInstagramAdapter(),
  facebook: new MetaFacebookAdapter(),
  whatsapp: new WhatsAppCloudAdapter(),
  tiktok: new TikTokAdapter(),
  mock: new MockAdapter(),
}

export function getAdapter(type: string): ChannelAdapter | null {
  return adapters[type.toLowerCase()] || null
}

export * from "./types"
