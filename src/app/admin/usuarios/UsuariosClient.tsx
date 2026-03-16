"use client"

import { useState } from "react"

interface Usuario {
    id: string
    nombre: string
    apellido: string
    telefono: string | null
    rol: string
    created_at: string
}

export default function UsuariosClient({ usuarios }: { usuarios: Usuario[] }) {
    const [busqueda, setBusqueda] = useState("")

    const rolBadge = (rol: string) => {
        const estilos: Record<string, string> = {
            admin: "bg-purple-100 text-purple-700",
            cliente: "bg-blue-100 text-blue-700",
            repartidor: "bg-orange-100 text-orange-700",
        }
        const labels: Record<string, string> = {
            admin: "Administrador",
            cliente: "Cliente",
            repartidor: "Repartidor",
        }
        return { estilo: estilos[rol] ?? "bg-gray-100 text-gray-600", label: labels[rol] ?? rol }
    }

    const filtrados = usuarios.filter(u => {
        const q = busqueda.toLowerCase()
        return (
            u.nombre?.toLowerCase().includes(q) ||
            u.apellido?.toLowerCase().includes(q) ||
            u.telefono?.toLowerCase().includes(q) ||
            u.rol?.toLowerCase().includes(q)
        )
    })

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Usuarios registrados</h1>
                <span className="text-sm text-gray-500">{filtrados.length} usuarios</span>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, apellido, teléfono o rol..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha de registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-400">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                filtrados.map(u => {
                                    const { estilo, label } = rolBadge(u.rol)
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">{u.nombre} {u.apellido}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{u.telefono ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${estilo}`}>
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {new Date(u.created_at).toLocaleDateString("es-AR")}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}