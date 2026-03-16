import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const { nombre, apellido, telefono, dni, fecha_contratacion, email, password } = await request.json()

    const { createClient: createAdmin } = await import("@supabase/supabase-js")
    const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message }, { status: 400 })
    }

    const { error: perfilError } = await admin.from("perfiles").upsert({
        id: authData.user.id,
        rol: "repartidor",
        nombre,
        apellido,
        telefono,
    })

    const { error: repartidorError } = await admin.from("repartidores").insert({
        id: authData.user.id,
        dni,
        fecha_contratacion,
        usuario_creado: true,
    })

    return NextResponse.json({ ok: true })
}