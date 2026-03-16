"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Repartidor {
    id: string
    nombre: string
    apellido: string
    telefono: string | null
    dni: string
    fecha_contratacion: string
    usuario_creado: boolean
    vehiculos: { patente: string; marca: string; modelo: string }[]
}

interface FormRepartidor {
    nombre: string
    apellido: string
    telefono: string
    dni: string
    fecha_contratacion: string
    email: string
    password: string
}

interface Vehiculo {
    id: string
    patente: string
    marca: string
    modelo: string
    estado: string
}

const formVacio: FormRepartidor = {
    nombre: "",
    apellido: "",
    telefono: "",
    dni: "",
    fecha_contratacion: "",
    email: "",
    password: "",
}

export default function Repartidores() {
    const supabase = createClient()
    const [repartidores, setRepartidores] = useState<Repartidor[]>([])
    const [busqueda, setBusqueda] = useState("")
    const repartidoresFiltrados = repartidores.filter(r => {
        const q = busqueda.toLowerCase()
        return (
            r.nombre?.toLowerCase().includes(q) ||
            r.apellido?.toLowerCase().includes(q) ||
            r.dni?.toLowerCase().includes(q) ||
            r.telefono?.toLowerCase().includes(q)
        )
    })
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
    const [modalAbierto, setModalAbierto] = useState(false)
    const [modalVehiculo, setModalVehiculo] = useState<Repartidor | null>(null)
    const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState<string[]>([])
    const [editando, setEditando] = useState<Repartidor | null>(null)
    const [form, setForm] = useState<FormRepartidor>(formVacio)
    const [cargando, setCargando] = useState(false)
    const [guardandoVehiculo, setGuardandoVehiculo] = useState(false)

    const cargar = async () => {
        const { data } = await supabase
            .from("repartidores")
            .select(`
                *,
                perfiles ( nombre, apellido, telefono ),
                repartidor_vehiculo (
                    vehiculo_id,
                    vehiculos ( patente, marca, modelo )
                )
            `)
            .order("fecha_contratacion", { ascending: false })

        if (data) {
            const mapeados = data.map((r: any) => ({
                id: r.id,
                nombre: r.perfiles?.nombre ?? "",
                apellido: r.perfiles?.apellido ?? "",
                telefono: r.perfiles?.telefono ?? null,
                dni: r.dni,
                fecha_contratacion: r.fecha_contratacion,
                usuario_creado: r.usuario_creado,
                vehiculos: r.repartidor_vehiculo?.map((rv: any) => rv.vehiculos).filter(Boolean) ?? [],
            }))
            setRepartidores(mapeados)
        }

        const { data: vehs } = await supabase
            .from("vehiculos")
            .select("*")
            .eq("estado", "activo")
            .order("marca")
        if (vehs) setVehiculos(vehs)
    }

    useEffect(() => { cargar() }, [])

    const abrirCrear = () => {
        setEditando(null)
        setForm(formVacio)
        setModalAbierto(true)
    }

    const abrirEditar = (r: Repartidor) => {
        setEditando(r)
        setForm({
            nombre: r.nombre,
            apellido: r.apellido,
            telefono: r.telefono ?? "",
            dni: r.dni,
            fecha_contratacion: r.fecha_contratacion,
            email: "",
            password: "",
        })
        setModalAbierto(true)
    }

    const abrirAsignarVehiculo = (r: Repartidor) => {
        setModalVehiculo(r)
        setVehiculosSeleccionados(r.vehiculos.map((v: any) => {
            const rv = vehiculos.find(veh => veh.patente === v.patente)
            return rv?.id ?? ""
        }).filter(Boolean))
    }

    const handleGuardarVehiculo = async () => {
        if (!modalVehiculo) return
        setGuardandoVehiculo(true)

        // Eliminar asignaciones anteriores
        await supabase
            .from("repartidor_vehiculo")
            .delete()
            .eq("repartidor_id", modalVehiculo.id)

        // Insertar nuevas asignaciones
        if (vehiculosSeleccionados.length > 0) {
            await supabase.from("repartidor_vehiculo").insert(
                vehiculosSeleccionados.map(vid => ({
                    repartidor_id: modalVehiculo.id,
                    vehiculo_id: vid,
                }))
            )
        }

        await cargar()
        setModalVehiculo(null)
        setGuardandoVehiculo(false)
    }

    const toggleVehiculo = (id: string) => {
        setVehiculosSeleccionados(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        )
    }

    const handleGuardar = async () => {
        if (!form.nombre || !form.apellido || !form.dni || !form.fecha_contratacion) return
        setCargando(true)

        if (editando) {
            await supabase.from("perfiles").update({
                nombre: form.nombre,
                apellido: form.apellido,
                telefono: form.telefono,
            }).eq("id", editando.id)

            await supabase.from("repartidores").update({
                dni: form.dni,
                fecha_contratacion: form.fecha_contratacion,
            }).eq("id", editando.id)
        } else {
            if (!form.email || !form.password) {
                alert("Completá el email y contraseña para crear el usuario")
                setCargando(false)
                return
            }

            const res = await fetch("/api/admin/crear-repartidor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            if (!res.ok) {
                alert("Error al crear el repartidor")
                setCargando(false)
                return
            }
        }

        await cargar()
        setModalAbierto(false)
        setCargando(false)
    }

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Eliminar este repartidor?")) return
        await supabase.from("perfiles").delete().eq("id", id)
        await cargar()
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de repartidores</h1>
                <button
                    onClick={abrirCrear}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                    + Agregar repartidor
                </button>
            </div>
            <div className="mb-4">
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, apellido, DNI o teléfono..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">DNI</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Contratación</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vehículos</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {repartidoresFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-400">
                                        No hay repartidores registrados
                                    </td>
                                </tr>
                            ) : (
                                repartidoresFiltrados.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {r.nombre} {r.apellido}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{r.dni}</td>
                                        <td className="px-4 py-3 text-gray-500">{r.telefono ?? "—"}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {new Date(r.fecha_contratacion).toLocaleDateString("es-AR")}
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.vehiculos.length === 0 ? (
                                                <span className="text-gray-400 text-xs">Sin asignar</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {r.vehiculos.map((v, i) => (
                                                        <span key={i} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                                            {v.patente}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => abrirAsignarVehiculo(r)}
                                                    className="text-green-600 hover:underline text-xs font-medium"
                                                >
                                                    Vehículo
                                                </button>
                                                <button
                                                    onClick={() => abrirEditar(r)}
                                                    className="text-blue-600 hover:underline text-xs font-medium"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(r.id)}
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

            {/* Modal asignar vehículo */}
            {modalVehiculo && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-1">
                            Asignar vehículo
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {modalVehiculo.nombre} {modalVehiculo.apellido}
                        </p>

                        {vehiculos.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">
                                No hay vehículos activos disponibles
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {vehiculos.map(v => (
                                    <label key={v.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${vehiculosSeleccionados.includes(v.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                                        <input
                                            type="checkbox"
                                            checked={vehiculosSeleccionados.includes(v.id)}
                                            onChange={() => toggleVehiculo(v.id)}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{v.marca} {v.modelo}</p>
                                            <p className="text-xs text-gray-500 font-mono">{v.patente}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setModalVehiculo(null)}
                                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardarVehiculo}
                                disabled={guardandoVehiculo}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                            >
                                {guardandoVehiculo ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal crear/editar repartidor */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-800 mb-5">
                            {editando ? "Editar repartidor" : "Agregar repartidor"}
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input type="text" value={form.nombre}
                                        onChange={e => setForm({ ...form, nombre: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Juan" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input type="text" value={form.apellido}
                                        onChange={e => setForm({ ...form, apellido: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="García" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                                <input type="text" value={form.dni}
                                    onChange={e => setForm({ ...form, dni: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="12345678" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input type="tel" value={form.telefono}
                                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="2994123456" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de contratación</label>
                                <input type="date" value={form.fecha_contratacion}
                                    onChange={e => setForm({ ...form, fecha_contratacion: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            {!editando && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Credenciales de acceso</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input type="email" value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="repartidor@frostbake.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                            <input type="password" value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Mínimo 6 caracteres" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModalAbierto(false)}
                                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                                Cancelar
                            </button>
                            <button onClick={handleGuardar} disabled={cargando}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                                {cargando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}