"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Producto {
    id: string
    nombre: string
    peso_contenido: string
    stock: number
    precio: number
    created_at: string
}

interface FormProducto {
    nombre: string
    peso_contenido: string
    stock: string
    precio: string
}

const formVacio: FormProducto = {
    nombre: "",
    peso_contenido: "",
    stock: "",
    precio: "",
}

export default function Stock() {
    const supabase = createClient()
    const [productos, setProductos] = useState<Producto[]>([])
    const [modalAbierto, setModalAbierto] = useState(false)
    const [editando, setEditando] = useState<Producto | null>(null)
    const [form, setForm] = useState<FormProducto>(formVacio)
    const [cargando, setCargando] = useState(false)

    const cargarProductos = async () => {
        const { data } = await supabase
            .from("productos")
            .select("*")
            .order("nombre")
        if (data) setProductos(data)
    }

    useEffect(() => { cargarProductos() }, [])

    const diasDesdeCreacion = (fecha: string) => {
        const diff = new Date().getTime() - new Date(fecha).getTime()
        return Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    const estadoProducto = (p: Producto) => {
        if (diasDesdeCreacion(p.created_at) >= 90) return "vencido"
        if (p.stock === 0) return "sin_stock"
        return "hay_stock"
    }

    const abrirCrear = () => {
        setEditando(null)
        setForm(formVacio)
        setModalAbierto(true)
    }

    const abrirEditar = (p: Producto) => {
        setEditando(p)
        setForm({
            nombre: p.nombre,
            peso_contenido: p.peso_contenido,
            stock: String(p.stock),
            precio: String(p.precio),
        })
        setModalAbierto(true)
    }

    const handleGuardar = async () => {
        if (!form.nombre || !form.peso_contenido || !form.stock || !form.precio) return
        setCargando(true)

        const datos = {
            nombre: form.nombre,
            peso_contenido: form.peso_contenido,
            stock: parseInt(form.stock),
            precio: parseFloat(form.precio),
        }

        if (editando) {
            await supabase.from("productos").update(datos).eq("id", editando.id)
        } else {
            await supabase.from("productos").insert(datos)
        }

        await cargarProductos()
        setModalAbierto(false)
        setCargando(false)
    }

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Eliminár este producto?")) return
        await supabase.from("productos").delete().eq("id", id)
        await cargarProductos()
    }

    const estadoBadge = (p: Producto) => {
        const estado = estadoProducto(p)
        if (estado === "vencido") return <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">Descontinuado</span>
        if (estado === "sin_stock") return <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">Sin stock</span>
        return <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Hay stock</span>
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de stock</h1>
                <button
                    onClick={abrirCrear}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                    + Agregar producto
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Contenido</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Stock</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Precio</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {productos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-400">
                                        No hay productos cargados
                                    </td>
                                </tr>
                            ) : (
                                productos.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                                        <td className="px-4 py-3 text-gray-500">{p.peso_contenido}</td>
                                        <td className="px-4 py-3 text-gray-800">{p.stock}</td>
                                        <td className="px-4 py-3 text-gray-800">${p.precio}</td>
                                        <td className="px-4 py-3">{estadoBadge(p)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => abrirEditar(p)}
                                                    className="text-blue-600 hover:underline text-xs font-medium"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(p.id)}
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
                            {editando ? "Editar producto" : "Agregar producto"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Ej: Medialunas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Peso / Contenido</label>
                                <input
                                    type="text"
                                    value={form.peso_contenido}
                                    onChange={e => setForm({ ...form, peso_contenido: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Ej: Bolsa x 12 unidades"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        value={form.stock}
                                        onChange={e => setForm({ ...form, stock: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio por bolsa</label>
                                    <input
                                        type="number"
                                        value={form.precio}
                                        onChange={e => setForm({ ...form, precio: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
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