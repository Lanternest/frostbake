"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Pedido {
    id: string
    estado: string
    total: number
    notas: string | null
    created_at: string
    perfiles: { nombre: string; apellido: string } | null
    locales: { nombre: string; direccion: string } | null
}

export default function Pedidos() {
    const supabase = createClient()
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [detalle, setDetalle] = useState<Pedido | null>(null)

    const cargarPedidos = async () => {
    const { data, error } = await supabase
        .from("pedidos")
        .select(`
            *,
            perfiles!pedidos_cliente_id_fkey ( nombre, apellido ),
            locales ( nombre, direccion )
        `)
        .neq("estado", "entregado")
        .order("created_at", { ascending: false })
    
    console.log("DATA:", JSON.stringify(data))
    console.log("ERROR:", JSON.stringify(error))
    
    if (data) setPedidos(data as Pedido[])
}

    useEffect(() => {
        cargarPedidos()
        const canal = supabase
            .channel("pedidos")
            .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, cargarPedidos)
            .subscribe()
        return () => { supabase.removeChannel(canal) }
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
        return { estilo: estilos[estado] ?? "bg-gray-100 text-gray-600", label: labels[estado] ?? estado }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Pedidos recientes</h1>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">N° Pedido</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Local</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pedidos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-400">
                                        No hay pedidos pendientes
                                    </td>
                                </tr>
                            ) : (
                                pedidos.map(p => {
                                    const { estilo, label } = estadoBadge(p.estado)
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                #{p.id.slice(0, 8)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {p.perfiles ? `${p.perfiles.nombre} ${p.perfiles.apellido}` : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {p.locales?.nombre ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-800">
                                                ${p.total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${estilo}`}>
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {new Date(p.created_at).toLocaleDateString("es-AR")}
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
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal detalle */}
            {detalle && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">
                            Detalle pedido #{detalle.id.slice(0, 8)}
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Cliente</span>
                                <span className="font-medium text-gray-800">
                                    {detalle.perfiles ? `${detalle.perfiles.nombre} ${detalle.perfiles.apellido}` : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Local</span>
                                <span className="font-medium text-gray-800">{detalle.locales?.nombre ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Dirección</span>
                                <span className="font-medium text-gray-800">{detalle.locales?.direccion ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total</span>
                                <span className="font-bold text-blue-700">${detalle.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Estado</span>
                                <span className="font-medium text-gray-800">{detalle.estado}</span>
                            </div>
                            {detalle.notas && (
                                <div>
                                    <span className="text-gray-500">Notas</span>
                                    <p className="mt-1 text-gray-800 bg-gray-50 rounded-xl p-3">{detalle.notas}</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setDetalle(null)}
                            className="w-full mt-6 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}