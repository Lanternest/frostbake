import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboard() {
    const supabase = await createClient()

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const [
        { count: pedidosHoy },
        { data: ventasHoy },
        { count: clientesActivos },
        { count: totalProductos },
    ] = await Promise.all([
        supabase.from("pedidos").select("*", { count: "exact", head: true })
            .gte("created_at", hoy.toISOString()),
        supabase.from("pedidos").select("total")
            .gte("created_at", hoy.toISOString()),
        supabase.from("perfiles").select("*", { count: "exact", head: true })
            .eq("rol", "cliente"),
        supabase.from("productos").select("*", { count: "exact", head: true }),
    ])

    const montoHoy = ventasHoy?.reduce((acc, p) => acc + p.total, 0) ?? 0

    const stats = [
        { label: "Pedidos del día", valor: pedidosHoy ?? 0, icono: "🛒", color: "blue" },
        { label: "Ventas del día", valor: `$${montoHoy.toFixed(2)}`, icono: "💰", color: "green" },
        { label: "Clientes activos", valor: clientesActivos ?? 0, icono: "👥", color: "purple" },
        { label: "Productos", valor: totalProductos ?? 0, icono: "📦", color: "orange" },
    ]

    const colores: Record<string, string> = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        purple: "bg-purple-50 text-purple-700",
        orange: "bg-orange-50 text-orange-700",
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${colores[stat.color]}`}>
                            {stat.icono}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-800">{stat.valor}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}