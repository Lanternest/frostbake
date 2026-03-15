"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [cargando, setCargando] = useState(false)
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setCargando(true)
        setError("")

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError("Email o contraseña incorrectos")
            setCargando(false)
            return
        }

        if (data.user) {
            const { data: perfil } = await supabase
                .from("perfiles")
                .select("rol")
                .eq("id", data.user.id)
                .single()

            if (perfil?.rol === "admin") router.push("/admin")
            else if (perfil?.rol === "repartidor") router.push("/repartidor")
            else router.push("/cliente")
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/">
                        <span className="text-3xl font-bold text-blue-700">Frost</span>
                        <span className="text-3xl font-bold text-orange-500">Bake</span>
                    </Link>
                    <p className="text-gray-500 mt-2">Iniciá sesión en tu cuenta</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                            placeholder="••••••••"
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
                        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    ¿No tenés cuenta?{" "}
                    <Link href="/auth/registro" className="text-blue-700 font-medium hover:underline">
                        Registrarse
                    </Link>
                </p>

            </div>
        </main>
    )
}