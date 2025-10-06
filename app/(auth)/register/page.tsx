import { RegisterForm } from "@/components/auth/register-form"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Registro | MessageHub",
  description: "Crea tu cuenta en MessageHub para comenzar a gestionar tus mensajes",
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Crear cuenta</h1>
          <p className="mt-2 text-muted-foreground">Comienza a gestionar tus mensajes</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
