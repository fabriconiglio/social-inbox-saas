import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

/**
 * Callback OAuth para Instagram Business Login
 * Meta redirige aquí después de que el usuario autoriza la aplicación
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorReason = searchParams.get("error_reason")
    const errorDescription = searchParams.get("error_description")

    // Manejar errores de autorización
    if (error) {
      console.error("[Instagram OAuth] Error:", {
        error,
        errorReason,
        errorDescription,
      })
      
      // Redirigir a la página de configuración con error
      const redirectUrl = new URL("/app", request.url)
      redirectUrl.searchParams.set("oauth_error", "instagram")
      redirectUrl.searchParams.set("error", error)
      if (errorDescription) {
        redirectUrl.searchParams.set("message", errorDescription)
      }
      
      return NextResponse.redirect(redirectUrl)
    }

    // Verificar que tenemos el código de autorización
    if (!code) {
      console.error("[Instagram OAuth] No se recibió código de autorización")
      const redirectUrl = new URL("/app", request.url)
      redirectUrl.searchParams.set("oauth_error", "instagram")
      redirectUrl.searchParams.set("error", "no_code")
      redirectUrl.searchParams.set("message", "No se recibió código de autorización")
      return NextResponse.redirect(redirectUrl)
    }

    // Obtener App ID y Secret desde variables de entorno
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      console.error("[Instagram OAuth] Faltan credenciales de Meta")
      const redirectUrl = new URL("/app", request.url)
      redirectUrl.searchParams.set("oauth_error", "instagram")
      redirectUrl.searchParams.set("error", "missing_credentials")
      redirectUrl.searchParams.set("message", "Faltan credenciales de Meta en la configuración")
      return NextResponse.redirect(redirectUrl)
    }

    // Construir URL de redirección (debe coincidir con la configurada en Meta)
    const redirectUri = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/oauth/instagram/callback`

    // Intercambiar código por access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`

    console.log("[Instagram OAuth] Intercambiando código por token...")

    const tokenResponse = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error("[Instagram OAuth] Error al obtener token:", errorData)
      
      const redirectUrl = new URL("/app", request.url)
      redirectUrl.searchParams.set("oauth_error", "instagram")
      redirectUrl.searchParams.set("error", "token_exchange_failed")
      redirectUrl.searchParams.set("message", errorData.error?.message || "Error al obtener token de acceso")
      return NextResponse.redirect(redirectUrl)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error("[Instagram OAuth] No se recibió access token")
      const redirectUrl = new URL("/app", request.url)
      redirectUrl.searchParams.set("oauth_error", "instagram")
      redirectUrl.searchParams.set("error", "no_access_token")
      redirectUrl.searchParams.set("message", "No se recibió token de acceso")
      return NextResponse.redirect(redirectUrl)
    }

    console.log("[Instagram OAuth] Token obtenido exitosamente")

    // Obtener información del usuario/página autenticada
    // El state puede contener información sobre qué tenant/local conectar
    // Por ahora, redirigimos a la página de configuración con el token
    // El usuario deberá completar la configuración manualmente

    const redirectUrl = new URL("/app", request.url)
    redirectUrl.searchParams.set("instagram_oauth_success", "true")
    redirectUrl.searchParams.set("access_token", accessToken)
    
    // Si el state contiene información del tenant/local, incluirla
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state))
        if (stateData.tenantId) {
          redirectUrl.searchParams.set("tenant_id", stateData.tenantId)
        }
        if (stateData.localId) {
          redirectUrl.searchParams.set("local_id", stateData.localId)
        }
      } catch (e) {
        // State no es JSON válido, ignorar
        console.warn("[Instagram OAuth] State no es JSON válido:", state)
      }
    }

    // Redirigir a la página de configuración con el token
    // NOTA: En producción, deberías guardar el token de forma segura aquí
    // y no pasarlo por query params. Esto es solo para desarrollo.
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error("[Instagram OAuth] Error inesperado:", error)
    const redirectUrl = new URL("/app", request.url)
    redirectUrl.searchParams.set("oauth_error", "instagram")
    redirectUrl.searchParams.set("error", "unexpected_error")
    redirectUrl.searchParams.set("message", error instanceof Error ? error.message : "Error inesperado")
    return NextResponse.redirect(redirectUrl)
  }
}

