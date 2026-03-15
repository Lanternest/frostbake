"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface ResumenPeriodo {
    monto: number
    cantidad: number
}

export default function Facturacion() {
    const supabase = createClient()
    const [hoy, setHoy] = useState<ResumenPeriodo>({ monto: 0, cantidad: 0 })
    const [semana, setSemana] = useState<ResumenPeriodo>({ monto: 0, cantidad: 0 })
    const [mes, setMes] = useState<ResumenPeriodo>({ monto: 0, cantidad: 0 })
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            const ahora = new Date()

            const inicioDia = new Date(ahora)
            inicioDia.setHours(0, 0, 0, 0)

            const inicioSemana = new Date(ahora)
            inicioSemana.setDate(ahora.getDate() - ahora.getDay())
            inicioSemana.setHours(0, 0, 0, 0)

            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

            const calcular = async (desde: Date): Promise<ResumenPeriodo> => {
                const { data } = await supabase
                    .from("pedidos")
                    .select("total")
                    .gte("created_at", desde.toISOString())
                if (!data) return { monto: 0, cantidad: 0 }
                return {
                    monto: data.reduce((acc, p) => acc + p.total, 0),
                    cantidad: data.length,
                }
            }

            const [resHoy, resSemana, resMes] = await Promise.all([
                calcular(inicioDia),
                calcular(inicioSemana),
                calcular(inicioMes),
            ])

            setHoy(resHoy)
            setSemana(resSemana)
            setMes(resMes)
            setCargando(false)
        }
        cargar()
    }, [])

    const generarReporte = async () => {
        const { data: pedidos } = await supabase
            .from("pedidos")
            .select(`
        id, total, estado, created_at,
        perfiles ( nombre, apellido ),
        locales ( nombre, direccion )
      `)
            .order("created_at", { ascending: false })

        if (!pedidos) return

        const { default: jsPDF } = await import("jspdf")
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.text("FrostBake - Reporte de facturación", 14, 20)

        doc.setFontSize(11)
        doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 30)

        doc.setFontSize(12)
        doc.text("Resumen", 14, 42)
        doc.setFontSize(10)
        doc.text(`Hoy: $${hoy.monto.toFixed(2)} (${hoy.cantidad} pedidos)`, 14, 50)
        doc.text(`Esta semana: $${semana.monto.toFixed(2)} (${semana.cantidad} pedidos)`, 14, 57)
        doc.text(`Este mes: $${mes.monto.toFixed(2)} (${mes.cantidad} pedidos)`, 14, 64)

        doc.setFontSize(12)
        doc.text("Detalle de pedidos", 14, 76)

        let y = 84
        doc.setFontSize(9)

        pedidos.forEach((p: any) => {
            if (y > 270) {
                doc.addPage()
                y = 20
            }
            const cliente = p.perfiles ? `${p.perfiles.nombre} ${p.perfiles.apellido}` : "—"
            const local = p.locales?.nombre ?? "—"
            const fecha = new Date(p.created_at).toLocaleDateString("es-AR")
            doc.text(`#${p.id.slice(0, 8)} | ${fecha} | ${cliente} | ${local} | $${p.total.toFixed(2)} | ${p.estado}`, 14, y)
            y += 7
        })

        doc.save(`frostbake-reporte-${new Date().toISOString().slice(0, 10)}.pdf`)
    }

    const periodos = [
        { label: "Hoy", data: hoy, icono: "📅" },
        { label: "Esta semana", data: semana, icono: "📆" },
        { label: "Este mes", data: mes, icono: "🗓️" },
    ]

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Facturación</h1>
                <button
                    onClick={generarReporte}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                    Generar reporte PDF
                </button>
            </div>

            {cargando ? (
                <div className="text-center py-20 text-gray-400">Cargando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {periodos.map((periodo, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">{periodo.icono}</span>
                                <h2 className="font-semibold text-gray-700">{periodo.label}</h2>
                            </div>
                            <p className="text-3xl font-bold text-blue-700 mb-1">
                                ${periodo.data.monto.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                                {periodo.data.cantidad} {periodo.data.cantidad === 1 ? "pedido" : "pedidos"}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}