import { createClient } from "@/lib/supabase/server"

export default async function Promociones() {
    const supabase = await createClient()

    const { data: promociones } = await supabase
        .from("promociones")
        .select("*")
        .eq("activa", true)
        .order("created_at", { ascending: false })

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Promociones</h1>

            {!promociones || promociones.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <p className="text-gray-500">No hay promociones activas por el momento</p>
                    <p className="text-gray-400 text-sm mt-1">¡Volvé pronto para ver las novedades!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {promociones.map(promo => (
                        <div
                            key={promo.id}
                            className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6"
                        >
                            <div className="text-3xl mb-3">🎉</div>
                            <h2 className="text-lg font-bold text-orange-800 mb-2">{promo.titulo}</h2>
                            {promo.descripcion && (
                                <p className="text-orange-700 text-sm leading-relaxed">{promo.descripcion}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}