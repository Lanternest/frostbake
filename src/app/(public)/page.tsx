import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
    const supabase = await createClient()
    const { data: productos } = await supabase
        .from("productos")
        .select("*")
        .limit(4)

    return (
        <main className="min-h-screen">

            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Panificados congelados<br />
                        <span className="text-orange-400">de calidad para tu negocio</span>
                    </h1>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Entregamos directamente en tu local. Productos frescos, congelados en su punto justo, listos para hornear.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/productos"
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
                        >
                            Ver productos
                        </Link>
                        <Link
                            href="/auth/registro"
                            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg border border-white/30"
                        >
                            Registrarse
                        </Link>
                    </div>
                </div>
            </section>

            {/* Características */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-14">
                        ¿Por qué elegir FrostBake?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icono: "🚚",
                                titulo: "Reparto a domicilio",
                                descripcion: "Entregamos directamente en tu local, sin que tengas que moverte."
                            },
                            {
                                icono: "❄️",
                                titulo: "Congelados de calidad",
                                descripcion: "Productos elaborados artesanalmente y congelados en su punto justo."
                            },
                            {
                                icono: "📦",
                                titulo: "Pedidos online",
                                descripcion: "Realizá tus pedidos desde la web en cualquier momento del día."
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                                <div className="text-5xl mb-4">{item.icono}</div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.titulo}</h3>
                                <p className="text-gray-500 leading-relaxed">{item.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Productos destacados */}
            {productos && productos.length > 0 && (
                <section className="py-20 px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                            Productos destacados
                        </h2>
                        <p className="text-center text-gray-500 mb-12">
                            Una muestra de lo que tenemos disponible
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {productos.map((p) => (
                                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="bg-blue-50 h-40 flex items-center justify-center">
                                        <span className="text-6xl">🥐</span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 mb-1">{p.nombre}</h3>
                                        <p className="text-sm text-gray-500 mb-3">{p.peso_contenido}</p>
                                        <p className="text-blue-700 font-bold text-lg">${p.precio}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-10">
                            <Link
                                href="/productos"
                                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                            >
                                Ver todos los productos
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA final */}
            <section className="bg-orange-500 py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        ¿Listo para hacer tu primer pedido?
                    </h2>
                    <p className="text-orange-100 text-lg mb-8">
                        Registrate gratis y empezá a pedir hoy mismo.
                    </p>
                    <Link
                        href="/auth/registro"
                        className="bg-white text-orange-500 font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors text-lg"
                    >
                        Crear cuenta gratis
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <span className="text-white font-bold text-xl">Frost</span>
                        <span className="text-orange-400 font-bold text-xl">Bake</span>
                    </div>
                    <p className="text-sm">© {new Date().getFullYear()} FrostBake. Todos los derechos reservados.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/productos" className="hover:text-white transition-colors">Productos</Link>
                        <Link href="/auth/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
                        <Link href="/auth/registro" className="hover:text-white transition-colors">Registrarse</Link>
                    </div>
                </div>
            </footer>

        </main>
    )
}