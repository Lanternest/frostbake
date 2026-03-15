import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    const supabase = await createClient()

    if (code) {
        await supabase.auth.exchangeCodeForSession(code)
    } else if (token_hash && type) {
        await supabase.auth.verifyOtp({ token_hash, type: type as any })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: perfil } = await supabase
            .from("perfiles")
            .select("rol")
            .eq("id", user.id)
            .single()

        if (perfil?.rol === "admin") return NextResponse.redirect(new URL("/admin", origin))
        if (perfil?.rol === "repartidor") return NextResponse.redirect(new URL("/repartidor", origin))
        if (perfil?.rol === "cliente") return NextResponse.redirect(new URL("/cliente", origin))
    }

    return NextResponse.redirect(new URL("/auth/login", origin))
}