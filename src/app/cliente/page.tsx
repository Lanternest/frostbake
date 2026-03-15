"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Perfil {
    nombre: string
    apellido: string
    telefono: string | null
}

interface Local {
    id: string
    nombre: string
    direccion: string
    codigo_postal: string | null
    telefono: string | null
}

interface FormLocal {
    nombre: string
    direccion: string
    codigo_postal: string
    telefono: string
}

const formLocalVacio: FormLocal = {
    nombre: "",
    direccion: "",
    codigo_postal: "",
    telefono: "",
}

export default function ClienteDatos() {
    const supabase = createClient()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [email, setEmail] = useState("")
    const [telefono, setTelefono] = useState("")
    const [usuarioId, setUsuarioId] = useState<string | null>(null)
    const [guardandoPerfil, setGuardandoPerfil] = useState(false)
    const [mensajePerfil, setMensajePerfil] = useState("")
    const [locales, setLocales] = useState<Local[]>([])
    const [modalLocal, setModalLocal] = useState(false)
    const [editandoLocal, setEditandoLocal] = useState<Local | null>(null)
    const [formLocal, setFormLocal] = useState<FormLocal>(formLocalVacio)
    const [cargandoLocal, setCargandoLocal] = useState(false)

    const cargarDatos = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUsuarioId(user.id)
        setEmail(user.email ?? "")

        const { data: perfilData } = await supabase
            .from("perfiles").select("*").eq("id", user.id).single()
        if (perfilData) {
            setPerfil(perfilData)
            setTelefono(perfilData.telefono ?? "")
        }

        const { data: localesData } = await supabase
            .from("locales").select("*").eq("cliente_id", user.id).order("nombre")
        if (localesData) setLocales(localesData)
    }

    useEffect(() => { cargarDatos() }, [])

    const handleGuardarPerfil = async () => {
        if (!usuarioId) return
        setGuardandoPerfil(true)
        await supabase.from("perfiles").update({ telefono }).eq("id", usuarioId)
        setMensajePerfil("Datos actualizados correctamente")
        setGuardandoPerfil(false)
        setTimeout(() => setMensajePerfil(""), 3000)
    }

    const abrirCrearLocal = () => {
        setEditandoLocal(null)
        setFormLocal(formLocalVacio)
        setModalLocal(true)
    }

    const abrirEditarLocal = (local: Local) => {
        setEditandoLocal(local)
        setFormLocal({
            nombre: local.nombre,
            direccion: local.direccion,
            codigo_postal: local.codigo_postal ?? "",
            telefono: local.telefono ?? "",
        })
        setModalLocal(true)
    }

    const handleGuardarLocal = async () => {
        if (!formLocal.nombre || !formLocal.direccion || !usuarioId) return
        setCargandoLocal(true)

        if (editandoLocal) {
            await supabase.from("locales").update({
                nombre: formLocal.nombre,
                direccion: formLocal.direccion,
                codigo_postal: formLocal.codigo_postal || null,
                telefono: formLocal.telefono || null,
            }).eq("id", editandoLocal.id)
        } else {
            await supabase.from("locales").insert({
                cliente_id: usuarioId,
                nombre: formLocal.nombre,
                direccion: formLocal.direccion,
                codigo_postal: formLocal.codigo_postal || null,
                telefono: formLocal.telefono || null,
            })
        }

        await cargarDatos()
        setModalLocal(false)
        setCargandoLocal(false)
    }

    const handleEliminarLocal = async (id: string) => {
        if (!confirm("¿Eliminar este local?")) return
        await supabase.from("locales").delete().eq("id", id)
        await cargarDatos()
    }

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Datos personales</h1>

            {/* Datos del perfil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <h2 className="font-semibold text-gray-700 mb-4">Mi cuenta</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Nombre</label>
                            <p className="font-medium text-gray-800">{perfil?.nombre}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Apellido</label>
                            <p className="font-medium text-gray-800">{perfil?.apellido}</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Email</label>
                        <p className="font-medium text-gray-800">{email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            value={telefono}
                            onChange={e => setTelefono(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Ej: 2994123456"
                        />
                    </div>
                </div>

                {mensajePerfil && (
                    <div className="mt-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
                        {mensajePerfil}
                    </div>
                )}

                <button
                    onClick={handleGuardarPerfil}
                    disabled={guardandoPerfil}
                    className="mt-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
                >
                    {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>

            {/* Locales */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">Mis locales</h2>
                    <button
                        onClick={abrirCrearLocal}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-3 py-1.5 rounded-xl transition-colors text-xs"
                    >
                        + Agregar local
                    </button>
                </div>

                {locales.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 text-sm mb-3">No tenés locales registrados</p>
                        <button
                            onClick={abrirCrearLocal}
                            className="text-blue-700 font-medium text-sm hover:underline"
                        >
                            Agregar tu primer local →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {locales.map(local => (
                            <div key={local.id} className="border border-gray-100 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800">{local.nombre}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">{local.direccion}</p>
                                        {local.codigo_postal && (
                                            <p className="text-xs text-gray-400 mt-0.5">CP: {local.codigo_postal}</p>
                                        )}
                                        {local.telefono && (
                                            <p className="text-xs text-gray-400">Tel: {local.telefono}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => abrirEditarLocal(local)}
                                            className="text-blue-600 hover:underline text-xs font-medium"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleEliminarLocal(local.id)}
                                            className="text-red-500 hover:underline text-xs font-medium"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal local */}
            {modalLocal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-5">
                            {editandoLocal ? "Editar local" : "Agregar local"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del local</label>
                                <input
                                    type="text"
                                    value={formLocal.nombre}
                                    onChange={e => setFormLocal({ ...formLocal, nombre: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Ej: Panadería Centro"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={formLocal.direccion}
                                    onChange={e => setFormLocal({ ...formLocal, direccion: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Ej: Av. Argentina 1234"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                                    <input
                                        type="text"
                                        value={formLocal.codigo_postal}
                                        onChange={e => setFormLocal({ ...formLocal, codigo_postal: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="8300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={formLocal.telefono}
                                        onChange={e => setFormLocal({ ...formLocal, telefono: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="2994123456"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setModalLocal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardarLocal}
                                disabled={cargandoLocal}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                            >
                                {cargandoLocal ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}