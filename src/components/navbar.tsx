"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Rol } from "@/types"

export default function Navbar() {
    const [usuario, setUsuario] = useState<{ email: string; rol: Rol } | null>(null)
    const [carritoCount, setCarritoCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        const obtenerUsuario = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: perfil } = await supabase
                    .from("perfiles")
                    .select("rol")
                    .eq("id", user.id)
                    .single()
                if (perfil) setUsuario({ email: user.email!, rol: perfil.rol })
            }
        }
        obtenerUsuario()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            obtenerUsuario()
        })
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
        setCarritoCount(carrito.length)
        const handler = () => {
            const c = JSON.parse(localStorage.getItem("carrito") || "[]")
            setCarritoCount(c.length)
        }
        window.addEventListener("carritoActualizado", handler)
        return () => window.removeEventListener("carritoActualizado", handler)
    }, [])

    const cerrarSesion = async () => {
        await supabase.auth.signOut()
        setUsuario(null)
        window.location.href = "/"
    }

    const panelLink = () => {
        if (!usuario) return null
        const links: Record<Rol, string> = {
            admin: "/admin",
            cliente: "/cliente",
            repartidor: "/repartidor"
        }
        return links[usuario.rol]
    }

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-700">Frost</span>
                    <span className="text-2xl font-bold text-orange-500">Bake</span>
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-gray-600 hover:text-blue-700 transition-colors text-sm font-medium">
                        Inicio
                    </Link>
                    <Link href="/productos" className="text-gray-600 hover:text-blue-700 transition-colors text-sm font-medium">
                        Productos
                    </Link>
                    {usuario && panelLink() && (
                        <Link href={panelLink()!} className="text-gray-600 hover:text-blue-700 transition-colors text-sm font-medium">
                            Mi panel
                        </Link>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-3">
                    {usuario ? (
                        <>
                            <span className="text-sm text-gray-500 hidden md:block">{usuario.email}</span>
                            <button
                                onClick={cerrarSesion}
                                className="text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
                            >
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/auth/login"
                                className="text-sm text-gray-600 hover:text-blue-700 transition-colors font-medium"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                href="/auth/registro"
                                className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                            >
                                Registrarse
                            </Link>
                        </>
                    )}

                    {/* Carrito — solo si está logueado como cliente */}
                    {usuario?.rol === "cliente" && (
                        <Link href="/carrito" className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 hover:text-blue-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {carritoCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                    {carritoCount}
                                </span>
                            )}
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}