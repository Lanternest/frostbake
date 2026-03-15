"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const navItems = [
    { href: "/admin", label: "Estadísticas", icono: "📊" },
    { href: "/admin/stock", label: "Gestión de stock", icono: "📦" },
    { href: "/admin/usuarios", label: "Usuarios registrados", icono: "👥" },
    { href: "/admin/pedidos", label: "Pedidos recientes", icono: "🛒" },
    { href: "/admin/facturacion", label: "Facturación", icono: "💰" },
    { href: "/admin/repartidores", label: "Repartidores", icono: "🚚" },
    { href: "/admin/vehiculos", label: "Vehículos", icono: "🚗" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const verificar = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/auth/login"); return }
            const { data: perfil } = await supabase
                .from("perfiles").select("rol").eq("id", user.id).single()
            if (perfil?.rol !== "admin") router.push("/")
        }
        verificar()
    }, [])

    const cerrarSesion = async () => {
        await supabase.auth.signOut()
        router.push("/")
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">

            {/* Sidebar desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full">
                <div className="p-6 border-b border-gray-100">
                    <Link href="/">
                        <span className="text-xl font-bold text-blue-700">Frost</span>
                        <span className="text-xl font-bold text-orange-500">Bake</span>
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Panel administrador</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === item.href
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <span>{item.icono}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={cerrarSesion}
                        className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors text-left px-3 py-2"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Mobile header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 h-14 flex items-center justify-between">
                <Link href="/">
                    <span className="text-lg font-bold text-blue-700">Frost</span>
                    <span className="text-lg font-bold text-orange-500">Bake</span>
                </Link>
                <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-gray-600">
                    {menuAbierto ? "✕" : "☰"}
                </button>
            </div>

            {/* Mobile menu */}
            {menuAbierto && (
                <div className="md:hidden fixed inset-0 bg-white z-40 pt-14">
                    <nav className="p-4 space-y-1">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuAbierto(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === item.href
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <span>{item.icono}</span>
                                {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={cerrarSesion}
                            className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors text-left px-3 py-3"
                        >
                            Cerrar sesión
                        </button>
                    </nav>
                </div>
            )}

            {/* Contenido principal */}
            <main className="flex-1 md:ml-64 pt-14 md:pt-0">
                <div className="p-6">
                    {children}
                </div>
            </main>

        </div>
    )
}