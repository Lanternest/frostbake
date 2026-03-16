"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Pedido {
    id: string
    estado: string
    total: number
    notas: string | null
    created_at: string
    vehiculo_id: string | null
    perfiles: { nombre: string; apellido: string } | null
    locales: { nombre: string; direccion: string } | null
}

interface Vehiculo {
    id: string
    patente: string
    marca: string
    modelo: string
    repartidores: { nombre: string; apellido: string }[]
}

export default function Pedidos() {
    const supabase = createClient()
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [busqueda, setBusqueda] = useState("")

    const pedidosFiltrados = pedidos.filter(p => {
        const q = busqueda.toLowerCase()
        const cliente = p.perfiles ? `${p.perfiles.nombre} ${p.perfiles.apellido}`.toLowerCase() : ""
        const local = p.locales?.nombre?.toLowerCase() ?? ""
        const estado = p.estado?.toLowerCase() ?? ""
        const id = p.id.slice(0, 8).toLowerCase()
        return cliente.includes(q) || local.includes(q) || estado.includes(q) || id.includes(q)
    })
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
    const [detalle, setDetalle] = useState<Pedido | null>(null)
    const [asignando, setAsignando] = useState<Pedido | null>(null)
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("")
    const [guardandoAsignacion, setGuardandoAsignacion] = useState(false)

    const cargarPedidos = async () => {
        const { data } = await supabase
            .from("pedidos")
            .select(`
                *,
                perfiles!pedidos_cliente_id_fkey ( nombre, apellido ),
                locales ( nombre, direccion )
            `)
            .neq("estado", "entregado")
            .order("created_at", { ascending: false })

        if (data) setPedidos(data as Pedido[])
    }

    const cargarVehiculos = async () => {
        const { data } = await supabase
            .from("vehiculos")
            .select(`
                *,
                repartidor_vehiculo (
                    repartidores:repartidor_id (
                        perfiles ( nombre, apellido )
                    )
                )
            `)
            .eq("estado", "activo")
            .order("marca")

        if (data) {
            const mapeados = data.map((v: any) => ({
                id: v.id,
                patente: v.patente,
                marca: v.marca,
                modelo: v.modelo,
                repartidores: v.repartidor_vehiculo
                    ?.map((rv: any) => rv.repartidores?.perfiles)
                    .filter(Boolean) ?? [],
            }))
            setVehiculos(mapeados)
        }
    }

    useEffect(() => {
        cargarPedidos()
        cargarVehiculos()
        const canal = supabase
            .channel("pedidos")
            .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, cargarPedidos)
            .subscribe()
        return () => { supabase.removeChannel(canal) }
    }, [])

    const handleAsignarVehiculo = async () => {
        if (!asignando) return
        setGuardandoAsignacion(true)

        await supabase
            .from("pedidos")
            .update({ vehiculo_id: vehiculoSeleccionado || null })
            .eq("id", asignando.id)

        await cargarPedidos()
        setAsignando(null)
        setVehiculoSeleccionado("")
        setGuardandoAsignacion(false)
    }

    const abrirAsignar = (p: Pedido) => {
        setAsignando(p)
        setVehiculoSeleccionado(p.vehiculo_id ?? "")
    }

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

    const vehiculoDelPedido = (vehiculo_id: string | null) => {
        if (!vehiculo_id) return null
        return vehiculos.find(v => v.id === vehiculo_id) ?? null
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Pedidos recientes</h1>
            <div className="mb-4">
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por cliente, local, estado o N° pedido..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>
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
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vehículo</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pedidosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-400">
                                        No hay pedidos pendientes
                                    </td>
                                </tr>
                            ) : (
                                pedidosFiltrados.map(p => {
                                    const { estilo, label } = estadoBadge(p.estado)
                                    const vehiculo = vehiculoDelPedido(p.vehiculo_id)
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
                                            <td className="px-4 py-3">
                                                {vehiculo ? (
                                                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                                                        {vehiculo.patente}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {new Date(p.created_at).toLocaleDateString("es-AR")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => abrirAsignar(p)}
                                                        className="text-green-600 hover:underline text-xs font-medium"
                                                    >
                                                        Asignar
                                                    </button>
                                                    <button
                                                        onClick={() => setDetalle(p)}
                                                        className="text-blue-600 hover:underline text-xs font-medium"
                                                    >
                                                        Detalle
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal asignar vehículo */}
            {asignando && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-1">Asignar vehículo</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Pedido #{asignando.id.slice(0, 8)} — {asignando.locales?.nombre ?? "—"}
                        </p>

                        <div className="space-y-2">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${vehiculoSeleccionado === "" ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}>
                                <input
                                    type="radio"
                                    name="vehiculo"
                                    value=""
                                    checked={vehiculoSeleccionado === ""}
                                    onChange={() => setVehiculoSeleccionado("")}
                                />
                                <span className="text-sm text-gray-500">Sin asignar</span>
                            </label>

                            {vehiculos.map(v => (
                                <label key={v.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${vehiculoSeleccionado === v.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                                    <input
                                        type="radio"
                                        name="vehiculo"
                                        value={v.id}
                                        checked={vehiculoSeleccionado === v.id}
                                        onChange={() => setVehiculoSeleccionado(v.id)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{v.marca} {v.modelo}</p>
                                        <p className="text-xs font-mono text-gray-500">{v.patente}</p>
                                        {v.repartidores.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                🚚 {v.repartidores.map(r => `${r.nombre} ${r.apellido}`).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setAsignando(null); setVehiculoSeleccionado("") }}
                                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAsignarVehiculo}
                                disabled={guardandoAsignacion}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                            >
                                {guardandoAsignacion ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="flex justify-between">
                                <span className="text-gray-500">Vehículo</span>
                                <span className="font-medium text-gray-800">
                                    {vehiculoDelPedido(detalle.vehiculo_id)?.patente ?? "Sin asignar"}
                                </span>
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