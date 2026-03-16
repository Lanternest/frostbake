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
    created_at: string
    notas: string | null
    locales: { nombre: string; direccion: string } | null
    pedido_items: PedidoItem[]
}

export default function PedidosCliente() {
    const supabase = createClient()
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [busqueda, setBusqueda] = useState("")
    const pedidosFiltrados = pedidos.filter(p => {
        const q = busqueda.toLowerCase()
        const local = p.locales?.nombre?.toLowerCase() ?? ""
        const estado = p.estado?.toLowerCase() ?? ""
        const id = p.id.slice(0, 8).toLowerCase()
        return local.includes(q) || estado.includes(q) || id.includes(q)
    })
    const [detalle, setDetalle] = useState<Pedido | null>(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from("pedidos")
                .select(`
          *,
          locales ( nombre, direccion ),
          pedido_items (
            cantidad,
            precio_unitario,
            productos ( nombre )
          )
        `)
                .eq("cliente_id", user.id)
                .order("created_at", { ascending: false })

            if (data) setPedidos(data as Pedido[])
            setCargando(false)
        }
        cargar()
    }, [])

    const estadoBadge = (estado: string) => {
        const estilos: Record<string, string> = {
            pendiente: "bg-yellow-100 text-yellow-700",
            en_camino: "bg-blue-100 text-blue-700",
            entregado: "bg-green-100 text-green-700",
        }
        const labels: Record<string, string> = {
            pendiente: "Pendiente",
            en_camino: "En camino",
            entregado: "Entregado",
        }
        return {
            estilo: estilos[estado] ?? "bg-gray-100 text-gray-600",
            label: labels[estado] ?? estado
        }
    }

    if (cargando) {
        return <div className="text-center py-20 text-gray-400">Cargando...</div>
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Historial de pedidos</h1>
            <div className="mb-4">
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por local, estado o N° pedido..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>
            {pedidosFiltrados.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="text-5xl mb-4">🛒</div>
                    <p className="text-gray-500 mb-2">Todavía no realizaste ningún pedido</p>
                    <a href="/productos" className="text-blue-700 font-medium text-sm hover:underline">
                        Ver productos →
                    </a>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">N° Pedido</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pedidosFiltrados.map(p => {
                                    const { estilo, label } = estadoBadge(p.estado)
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                #{p.id.slice(0, 8)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(p.created_at).toLocaleDateString("es-AR")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${estilo}`}>
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-800">
                                                ${p.total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setDetalle(p)}
                                                    className="text-blue-600 hover:underline text-xs font-medium"
                                                >
                                                    Ver detalle
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal detalle */}
            {detalle && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">
                            Pedido #{detalle.id.slice(0, 8)}
                        </h2>

                        <div className="space-y-3 text-sm mb-5">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Fecha</span>
                                <span className="font-medium text-gray-800">
                                    {new Date(detalle.created_at).toLocaleDateString("es-AR")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Estado</span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${estadoBadge(detalle.estado).estilo}`}>
                                    {estadoBadge(detalle.estado).label}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Local</span>
                                <span className="font-medium text-gray-800">{detalle.locales?.nombre ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Dirección</span>
                                <span className="font-medium text-gray-800 text-right max-w-[200px]">
                                    {detalle.locales?.direccion ?? "—"}
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="border-t border-gray-100 pt-4 mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Productos</p>
                            <div className="space-y-2">
                                {detalle.pedido_items.map((item, i) => (
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

                        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-800">
                            <span>Total</span>
                            <span className="text-blue-700">${detalle.total.toFixed(2)}</span>
                        </div>

                        {detalle.notas && (
                            <div className="mt-4 bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                                <span className="font-medium">Notas: </span>{detalle.notas}
                            </div>
                        )}

                        <button
                            onClick={() => setDetalle(null)}
                            className="w-full mt-5 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}