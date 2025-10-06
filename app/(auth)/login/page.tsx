import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | MessageHub",
  description: "Inicia sesión en MessageHub para gestionar todos tus mensajes de redes sociales",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">MessageHub</h1>
          <p className="mt-2 text-muted-foreground">Centraliza todos tus mensajes de redes sociales</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
