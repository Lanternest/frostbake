"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Vehiculo {
    id: string
    patente: string
    marca: string
    modelo: string
    estado: "activo" | "en_reparacion"
}

interface FormVehiculo {
    patente: string
    marca: string
    modelo: string
    estado: "activo" | "en_reparacion"
}

const formVacio: FormVehiculo = {
    patente: "",
    marca: "",
    modelo: "",
    estado: "activo",
}

export default function Vehiculos() {
    const supabase = createClient()
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
    const [busqueda, setBusqueda] = useState("")
    const vehiculosFiltrados = vehiculos.filter(v => {
        const q = busqueda.toLowerCase()
        return (
            v.patente?.toLowerCase().includes(q) ||
            v.marca?.toLowerCase().includes(q) ||
            v.modelo?.toLowerCase().includes(q) ||
            v.estado?.toLowerCase().includes(q)
        )
    })
    const [modalAbierto, setModalAbierto] = useState(false)
    const [editando, setEditando] = useState<Vehiculo | null>(null)
    const [form, setForm] = useState<FormVehiculo>(formVacio)
    const [cargando, setCargando] = useState(false)

    const cargar = async () => {
        const { data } = await supabase
            .from("vehiculos")
            .select("*")
            .order("marca")
        if (data) setVehiculos(data)
    }

    useEffect(() => { cargar() }, [])

    const abrirCrear = () => {
        setEditando(null)
        setForm(formVacio)
        setModalAbierto(true)
    }

    const abrirEditar = (v: Vehiculo) => {
        setEditando(v)
        setForm({
            patente: v.patente,
            marca: v.marca,
            modelo: v.modelo,
            estado: v.estado,
        })
        setModalAbierto(true)
    }

    const handleGuardar = async () => {
        if (!form.patente || !form.marca || !form.modelo) return
        setCargando(true)

        if (editando) {
            await supabase.from("vehiculos").update(form).eq("id", editando.id)
        } else {
            await supabase.from("vehiculos").insert(form)
        }

        await cargar()
        setModalAbierto(false)
        setCargando(false)
    }

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Eliminar este vehículo?")) return
        await supabase.from("vehiculos").delete().eq("id", id)
        await cargar()
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de vehículos</h1>
                <button
                    onClick={abrirCrear}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                    + Agregar vehículo
                </button>
            </div>
            <div className="mb-4">
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por patente, marca, modelo o estado..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Patente</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Modelo</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {vehiculosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-400">
                                        No hay vehículos registrados
                                    </td>
                                </tr>
                            ) : (
                                vehiculosFiltrados.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-medium text-gray-800">
                                            {v.patente}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{v.marca}</td>
                                        <td className="px-4 py-3 text-gray-600">{v.modelo}</td>
                                        <td className="px-4 py-3">
                                            {v.estado === "activo"
                                                ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Activo</span>
                                                : <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">En reparación</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => abrirEditar(v)}
                                                    className="text-blue-600 hover:underline text-xs font-medium"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(v.id)}
                                                    className="text-red-500 hover:underline text-xs font-medium"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-5">
                            {editando ? "Editar vehículo" : "Agregar vehículo"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
                                <input
                                    type="text"
                                    value={form.patente}
                                    onChange={e => setForm({ ...form, patente: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="ABC123"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                    <input
                                        type="text"
                                        value={form.marca}
                                        onChange={e => setForm({ ...form, marca: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Ford"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                                    <input
                                        type="text"
                                        value={form.modelo}
                                        onChange={e => setForm({ ...form, modelo: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Transit"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select
                                    value={form.estado}
                                    onChange={e => setForm({ ...form, estado: e.target.value as "activo" | "en_reparacion" })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
                                    <option value="activo">Activo</option>
                                    <option value="en_reparacion">En reparación</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={cargando}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                            >
                                {cargando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}