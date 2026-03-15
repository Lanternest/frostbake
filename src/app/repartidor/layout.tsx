"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RepartidorLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const supabase = createClient()
    const [nombre, setNombre] = useState("")

    useEffect(() => {
        const verificar = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/auth/login"); return }
            const { data: perfil } = await supabase
                .from("perfiles").select("rol, nombre").eq("id", user.id).single()
            if (perfil?.rol !== "repartidor") { router.push("/"); return }
            setNombre(perfil.nombre)
        }
        verificar()
    }, [])

    const cerrarSesion = async () => {
        await supabase.auth.signOut()
        router.push("/")
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div>
                        <Link href="/">
                            <span className="text-lg font-bold text-blue-700">Frost</span>
                            <span className="text-lg font-bold text-orange-500">Bake</span>
                        </Link>
                        {nombre && (
                            <span className="text-xs text-gray-500 ml-2">Hola, {nombre}</span>
                        )}
                    </div>
                    <button
                        onClick={cerrarSesion}
                        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </header>

            {/* Contenido */}
            <main className="max-w-2xl mx-auto px-4 py-6">
                {children}
            </main>

        </div>
    )
}