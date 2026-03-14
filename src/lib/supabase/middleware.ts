import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Rutas protegidas
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
    const isClienteRoute = request.nextUrl.pathname.startsWith("/cliente")
    const isRepartidorRoute = request.nextUrl.pathname.startsWith("/repartidor")
    const isProtectedRoute = isAdminRoute || isClienteRoute || isRepartidorRoute

    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    if (user && isProtectedRoute) {
        const { data: perfil } = await supabase
            .from("perfiles")
            .select("rol")
            .eq("id", user.id)
            .single()

        if (perfil) {
            if (isAdminRoute && perfil.rol !== "admin") {
                return NextResponse.redirect(new URL("/", request.url))
            }
            if (isClienteRoute && perfil.rol !== "cliente") {
                return NextResponse.redirect(new URL("/", request.url))
            }
            if (isRepartidorRoute && perfil.rol !== "repartidor") {
                return NextResponse.redirect(new URL("/", request.url))
            }
        }
    }

    return supabaseResponse
}