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
    email?: string
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
    const [modalAbierto, setModalAbierto] = useState(false)
    const [editando, setEditando] = useState<Repartidor | null>(null)
    const [form, setForm] = useState<FormRepartidor>(formVacio)
    const [cargando, setCargando] = useState(false)
    const [creandoUsuario, setCreandoUsuario] = useState<string | null>(null)

    const cargar = async () => {
        const { data } = await supabase
            .from("repartidores")
            .select(`
        *,
        perfiles ( nombre, apellido, telefono )
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
            }))
            setRepartidores(mapeados)
        }
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">DNI</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Contratación</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {repartidores.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-400">
                                        No hay repartidores registrados
                                    </td>
                                </tr>
                            ) : (
                                repartidores.map(r => (
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
                                            {r.usuario_creado
                                                ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Creado</span>
                                                : <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded-full">Sin usuario</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
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

            {/* Modal */}
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
                                <>
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
                                </>
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