import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  console.log("[v0] Rendering home page")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold">MessageHub</h1>
        <p className="text-muted-foreground">Centraliza y gestiona todos tus mensajes de redes sociales desde un solo lugar</p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Registrarse</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
