"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Producto {
    id: string
    nombre: string
    peso_contenido: string
    stock: number
    precio: number
    created_at: string
}

export default function Productos() {
    const supabase = createClient()
    const router = useRouter()
    const [productos, setProductos] = useState<Producto[]>([])
    const [esCliente, setEsCliente] = useState(false)
    const [agregados, setAgregados] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const cargar = async () => {
            const { data } = await supabase
                .from("productos")
                .select("*")
                .order("nombre")
            if (data) setProductos(data)

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: perfil } = await supabase
                    .from("perfiles").select("rol").eq("id", user.id).single()
                setEsCliente(perfil?.rol === "cliente")
            }
        }
        cargar()
    }, [])

    const agregarAlCarrito = (producto: Producto) => {
        const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
        const index = carrito.findIndex((i: any) => i.producto.id === producto.id)

        if (index >= 0) {
            carrito[index].cantidad += 1
        } else {
            carrito.push({ producto, cantidad: 1 })
        }

        localStorage.setItem("carrito", JSON.stringify(carrito))
        window.dispatchEvent(new Event("carritoActualizado"))

        setAgregados(prev => ({ ...prev, [producto.id]: true }))
        setTimeout(() => {
            setAgregados(prev => ({ ...prev, [producto.id]: false }))
        }, 1500)
    }

    const ahora = new Date()

    return (
        <main className="min-h-screen bg-gray-50">

            {/* Header */}
            <section className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-14 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-3">Nuestros productos</h1>
                    <p className="text-blue-100 text-lg">
                        Panificados congelados listos para hornear
                    </p>
                </div>
            </section>

            {/* Grilla de productos */}
            <section className="py-14 px-4">
                <div className="max-w-6xl mx-auto">
                    {productos.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🥐</div>
                            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                                Próximamente
                            </h2>
                            <p className="text-gray-500">
                                Estamos cargando nuestro catálogo. ¡Volvé pronto!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {productos.map((p) => {
                                const fechaCreacion = new Date(p.created_at)
                                const diasTranscurridos = Math.floor(
                                    (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24)
                                )
                                const vencido = diasTranscurridos >= 90
                                const sinStock = p.stock === 0
                                const disponible = !vencido && !sinStock

                                return (
                                    <div
                                        key={p.id}
                                        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${!disponible ? "opacity-60 border-gray-100" : "border-gray-100"
                                            }`}
                                    >
                                        <div className="bg-blue-50 h-44 flex items-center justify-center relative">
                                            <span className="text-7xl">🥐</span>
                                            {vencido && (
                                                <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                                                    Sin stock
                                                </span>
                                            )}
                                            {!vencido && sinStock && (
                                                <span className="absolute top-3 right-3 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                                                    Agotado
                                                </span>
                                            )}
                                            {disponible && (
                                                <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                                                    Disponible
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-800 text-lg mb-1">
                                                {p.nombre}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-3">
                                                {p.peso_contenido}
                                            </p>
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-blue-700 font-bold text-xl">
                                                    ${p.precio}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Stock: {p.stock}
                                                </span>
                                            </div>

                                            {/* Botón agregar al carrito */}
                                            {esCliente && disponible && (
                                                <button
                                                    onClick={() => agregarAlCarrito(p)}
                                                    className={`w-full font-semibold py-2.5 rounded-xl transition-colors text-sm ${agregados[p.id]
                                                            ? "bg-green-500 text-white"
                                                            : "bg-blue-700 hover:bg-blue-800 text-white"
                                                        }`}
                                                >
                                                    {agregados[p.id] ? "✓ Agregado" : "Agregar al carrito"}
                                                </button>
                                            )}

                                            {!esCliente && disponible && (
                                                <button
                                                    onClick={() => router.push("/auth/login")}
                                                    className="w-full border border-blue-700 text-blue-700 hover:bg-blue-50 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                                                >
                                                    Iniciá sesión para comprar
                                                </button>
                                            )}

                                            {!disponible && (
                                                <div className="w-full bg-gray-100 text-gray-400 font-semibold py-2.5 rounded-xl text-sm text-center">
                                                    No disponible
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

        </main>
    )
}