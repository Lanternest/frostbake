"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface PedidoItem {
    cantidad: number
    precio_unitario: number
    productos: { nombre: string }
}

interface Pedido {
    id: string
    estado: string
    total: number
    notas: string | null
    created_at: string
    perfiles: { nombre: string; apellido: string; telefono: string | null } | null
    locales: { nombre: string; direccion: string; telefono: string | null } | null
    pedido_items: PedidoItem[]
}

export default function RepartidorPanel() {
    const supabase = createClient()
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [cargando, setCargando] = useState(true)
    const [expandido, setExpandido] = useState<string | null>(null)
    const [actualizando, setActualizando] = useState<string | null>(null)

    const cargar = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from("pedidos")
            .select(`
                *,
                perfiles!pedidos_cliente_id_fkey ( nombre, apellido, telefono ),
                locales ( nombre, direccion, telefono ),
                pedido_items (
                    cantidad,
                    precio_unitario,
                    productos ( nombre )
                )
            `)
            .neq("estado", "entregado")
            .gte("created_at", hoy.toISOString())
            .order("created_at")

        console.log("REPARTIDOR DATA:", JSON.stringify(data))
        console.log("REPARTIDOR ERROR:", JSON.stringify(error))

        if (data) setPedidos(data as Pedido[])
        setCargando(false)
    }

    useEffect(() => {
        cargar()
        const canal = supabase
            .channel("pedidos-repartidor")
            .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, cargar)
            .subscribe()
        return () => { supabase.removeChannel(canal) }
    }, [])

    const actualizarEstado = async (id: string, estado: string) => {
        setActualizando(id)
        await supabase.from("pedidos").update({ estado }).eq("id", id)
        await cargar()
        setActualizando(null)
    }

    const abrirMaps = (direccion: string) => {
        const query = encodeURIComponent(direccion)
        window.open(`https://maps.google.com/?q=${query}`, "_blank")
    }

    const llamar = (telefono: string) => {
        window.open(`tel:${telefono}`)
    }

    if (cargando) {
        return <div className="text-center py-20 text-gray-400">Cargando entregas...</div>
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Entregas de hoy</h1>
                <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
                </span>
            </div>

            {pedidos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <p className="text-gray-600 font-medium">No tenés entregas pendientes</p>
                    <p className="text-gray-400 text-sm mt-1">¡Todo al día por hoy!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pedidos.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                            {/* Header del pedido */}
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-gray-400">#{p.id.slice(0, 8)}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.estado === "en_camino"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {p.estado === "en_camino" ? "En camino" : "Pendiente"}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-gray-800">
                                            {p.locales?.nombre ?? "—"}
                                        </p>

                                        {/* Dirección clickeable para Maps */}
                                        <button
                                            onClick={e => { e.stopPropagation(); if (p.locales?.direccion) abrirMaps(p.locales.direccion) }}
                                            className="text-sm text-blue-600 hover:underline text-left mt-0.5"
                                        >
                                            📍 {p.locales?.direccion ?? "—"}
                                        </button>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-bold text-gray-800">${p.total.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {expandido === p.id ? "▲ Cerrar" : "▼ Ver más"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Detalle expandido */}
                            {expandido === p.id && (
                                <div className="border-t border-gray-100 p-4 space-y-4">

                                    {/* Cliente */}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cliente</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-800">
                                                {p.perfiles ? `${p.perfiles.nombre} ${p.perfiles.apellido}` : "—"}
                                            </p>
                                            {p.perfiles?.telefono && (
                                                <button
                                                    onClick={() => llamar(p.perfiles!.telefono!)}
                                                    className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
                                                >
                                                    📞 {p.perfiles.telefono}
                                                </button>
                                            )}
                                        </div>
                                        {p.locales?.telefono && (
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-sm text-gray-500">Tel. local</p>
                                                <button
                                                    onClick={() => llamar(p.locales!.telefono!)}
                                                    className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
                                                >
                                                    📞 {p.locales.telefono}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Productos */}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</p>
                                        <div className="space-y-1.5">
                                            {p.pedido_items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        {item.productos?.nombre} x{item.cantidad}
                                                    </span>
                                                    <span className="font-medium text-gray-800">
                                                        ${(item.precio_unitario * item.cantidad).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notas */}
                                    {p.notas && (
                                        <div className="bg-yellow-50 rounded-xl p-3 text-sm text-yellow-800">
                                            <span className="font-semibold">Nota: </span>{p.notas}
                                        </div>
                                    )}

                                    {/* Acciones */}
                                    <div className="flex gap-3 pt-2">
                                        {p.estado === "pendiente" && (
                                            <button
                                                onClick={() => actualizarEstado(p.id, "en_camino")}
                                                disabled={actualizando === p.id}
                                                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                                            >
                                                {actualizando === p.id ? "Actualizando..." : "🚚 Salí a entregar"}
                                            </button>
                                        )}
                                        {p.estado === "en_camino" && (
                                            <button
                                                onClick={() => actualizarEstado(p.id, "entregado")}
                                                disabled={actualizando === p.id}
                                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                                            >
                                                {actualizando === p.id ? "Actualizando..." : "✅ Marcar como entregado"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}