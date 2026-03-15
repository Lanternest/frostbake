"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function Registro() {
    const supabase = createClient()
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState("")
    const [registroExitoso, setRegistroExitoso] = useState(false)
    const [form, setForm] = useState({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        password: "",
        confirmar: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleRegistro = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (form.password !== form.confirmar) {
            setError("Las contraseñas no coinciden")
            return
        }
        if (form.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres")
            return
        }

        setCargando(true)

        const { error: authError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    nombre: form.nombre,
                    apellido: form.apellido,
                    telefono: form.telefono,
                }
            }
        })

        if (authError) {
            setError("Error al crear la cuenta. El email puede estar en uso.")
            setCargando(false)
            return
        }

        setRegistroExitoso(true)
        setCargando(false)
    }

    if (registroExitoso) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">
                    <div className="text-6xl mb-4">📧</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                        ¡Cuenta creada!
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Te enviamos un email de confirmación. Revisá tu bandeja de entrada y hacé clic en el enlace para activar tu cuenta.
                    </p>
                    <Link
                        href="/auth/login"
                        className="bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors inline-block"
                    >
                        Ir al login
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

                <div className="text-center mb-8">
                    <Link href="/">
                        <span className="text-3xl font-bold text-blue-700">Frost</span>
                        <span className="text-3xl font-bold text-orange-500">Bake</span>
                    </Link>
                    <p className="text-gray-500 mt-2">Creá tu cuenta de cliente</p>
                </div>

                <form onSubmit={handleRegistro} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                                placeholder="Juan"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido
                            </label>
                            <input
                                type="text"
                                name="apellido"
                                value={form.apellido}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                                placeholder="García"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            value={form.telefono}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                            placeholder="Ej: 2994123456"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            name="confirmar"
                            value={form.confirmar}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                            placeholder="Repetí tu contraseña"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
                    >
                        {cargando ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    ¿Ya tenés cuenta?{" "}
                    <Link href="/auth/login" className="text-blue-700 font-medium hover:underline">
                        Iniciar sesión
                    </Link>
                </p>

            </div>
        </main>
    )
}