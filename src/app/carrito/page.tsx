"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Producto } from "@/types"

interface ItemCarrito {
    producto: Producto
    cantidad: number
}

interface Local {
    id: string
    nombre: string
    direccion: string
}

export default function Carrito() {
    const router = useRouter()
    const supabase = createClient()
    const [items, setItems] = useState<ItemCarrito[]>([])
    const [locales, setLocales] = useState<Local[]>([])
    const [localSeleccionado, setLocalSeleccionado] = useState("")
    const [metodoPago, setMetodoPago] = useState<string[]>([])
    const [montoEfectivo, setMontoEfectivo] = useState("")
    const [montoTransferencia, setMontoTransferencia] = useState("")
    const [montoMP, setMontoMP] = useState("")
    const [notas, setNotas] = useState("")
    const [cargando, setCargando] = useState(false)
    const [usuarioId, setUsuarioId] = useState<string | null>(null)

    useEffect(() => {
        const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
        setItems(carrito)

        const obtenerDatos = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/auth/login"); return }
            setUsuarioId(user.id)

            const { data: localesData } = await supabase
                .from("locales")
                .select("id, nombre, direccion")
                .eq("cliente_id", user.id)
            if (localesData) setLocales(localesData)
        }
        obtenerDatos()
    }, [])

    const total = items.reduce(
        (acc, item) => acc + item.producto.precio * item.cantidad, 0
    )

    const toggleMetodo = (metodo: string) => {
        setMetodoPago(prev =>
            prev.includes(metodo)
                ? prev.filter(m => m !== metodo)
                : [...prev, metodo]
        )
    }

    const actualizarCantidad = (id: string, cantidad: number) => {
        if (cantidad < 1) return eliminarItem(id)
        const nuevos = items.map(i =>
            i.producto.id === id ? { ...i, cantidad } : i
        )
        setItems(nuevos)
        localStorage.setItem("carrito", JSON.stringify(nuevos))
        window.dispatchEvent(new Event("carritoActualizado"))
    }

    const eliminarItem = (id: string) => {
        const nuevos = items.filter(i => i.producto.id !== id)
        setItems(nuevos)
        localStorage.setItem("carrito", JSON.stringify(nuevos))
        window.dispatchEvent(new Event("carritoActualizado"))
    }

    const montoPagado = () => {
        let suma = 0
        if (metodoPago.includes("efectivo")) suma += parseFloat(montoEfectivo || "0")
        if (metodoPago.includes("transferencia")) suma += parseFloat(montoTransferencia || "0")
        if (metodoPago.includes("mercadopago")) suma += parseFloat(montoMP || "0")
        return suma
    }

    const handleConfirmar = async () => {
        if (!localSeleccionado) { alert("Seleccioná un local de entrega"); return }
        if (metodoPago.length === 0) { alert("Seleccioná al menos un método de pago"); return }
        if (metodoPago.length > 1 && Math.abs(montoPagado() - total) > 0.01) {
            alert(`Los montos deben sumar $${total.toFixed(2)}`); return
        }

        setCargando(true)

        const { data: pedido, error } = await supabase
            .from("pedidos")
            .insert({
                cliente_id: usuarioId,
                local_id: localSeleccionado,
                estado: "pendiente",
                total,
                notas,
            })
            .select()
            .single()

        if (error || !pedido) {
            alert("Error al crear el pedido. Intentá de nuevo.")
            setCargando(false)
            return
        }

        // Insertar items
        await supabase.from("pedido_items").insert(
            items.map(i => ({
                pedido_id: pedido.id,
                producto_id: i.producto.id,
                cantidad: i.cantidad,
                precio_unitario: i.producto.precio,
            }))
        )

        // Insertar pagos
        const pagos = []
        if (metodoPago.includes("efectivo")) {
            pagos.push({ pedido_id: pedido.id, metodo: "efectivo", monto: metodoPago.length === 1 ? total : parseFloat(montoEfectivo) })
        }
        if (metodoPago.includes("transferencia")) {
            pagos.push({ pedido_id: pedido.id, metodo: "transferencia", monto: metodoPago.length === 1 ? total : parseFloat(montoTransferencia) })
        }
        if (metodoPago.includes("mercadopago")) {
            pagos.push({ pedido_id: pedido.id, metodo: "mercadopago", monto: metodoPago.length === 1 ? total : parseFloat(montoMP) })
        }
        await supabase.from("pagos").insert(pagos)

        // Mensaje WhatsApp
        const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
        const detalle = items.map(i => `• ${i.producto.nombre} x${i.cantidad}`).join("\n")
        const mensaje = encodeURIComponent(
            `Hola FrostBake! Hice un pedido:\n\n${detalle}\n\nTotal: $${total.toFixed(2)}\nPago: ${metodoPago.join(" + ")}\nN° pedido: ${pedido.id.slice(0, 8)}`
        )

        localStorage.setItem("carrito", "[]")
        window.dispatchEvent(new Event("carritoActualizado"))

        window.open(`https://wa.me/${numero}?text=${mensaje}`, "_blank")
        router.push("/cliente")
    }

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h2>
                    <p className="text-gray-500 mb-6">Agregá productos para hacer tu pedido</p>
                    <Link
                        href="/productos"
                        className="bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors"
                    >
                        Ver productos
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Tu carrito</h1>

                {/* Items */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
                    {items.map((item, i) => (
                        <div key={item.producto.id} className={`p-4 flex items-center gap-4 ${i !== 0 ? "border-t border-gray-100" : ""}`}>
                            <div className="bg-blue-50 rounded-xl h-16 w-16 flex items-center justify-center text-3xl flex-shrink-0">
                                🥐
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">{item.producto.nombre}</h3>
                                <p className="text-sm text-gray-500">{item.producto.peso_contenido}</p>
                                <p className="text-blue-700 font-bold">${item.producto.precio}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                                <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                                    +
                                </button>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-800">${(item.producto.precio * item.cantidad).toFixed(2)}</p>
                                <button onClick={() => eliminarItem(item.producto.id)}
                                    className="text-xs text-red-500 hover:underline mt-1">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="text-2xl font-bold text-blue-700">${total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Local de entrega */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="font-semibold text-gray-800 mb-4">Local de entrega</h2>
                    {locales.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-gray-500 mb-3">No tenés locales registrados</p>
                            <Link href="/cliente" className="text-blue-700 font-medium hover:underline text-sm">
                                Agregá un local desde tu panel →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {locales.map(local => (
                                <label key={local.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${localSeleccionado === local.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                                    <input type="radio" name="local" value={local.id}
                                        checked={localSeleccionado === local.id}
                                        onChange={() => setLocalSeleccionado(local.id)}
                                        className="mt-1" />
                                    <div>
                                        <p className="font-medium text-gray-800">{local.nombre}</p>
                                        <p className="text-sm text-gray-500">{local.direccion}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Método de pago */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="font-semibold text-gray-800 mb-4">Método de pago</h2>
                    <p className="text-sm text-gray-500 mb-4">Podés combinar métodos de pago</p>
                    <div className="space-y-3">
                        {[
                            { id: "efectivo", label: "Efectivo al entregar", icono: "💵" },
                            { id: "transferencia", label: "Transferencia bancaria", icono: "🏦" },
                            { id: "mercadopago", label: "MercadoPago", icono: "💳" },
                        ].map(metodo => (
                            <div key={metodo.id}>
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${metodoPago.includes(metodo.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                                    <input type="checkbox" checked={metodoPago.includes(metodo.id)}
                                        onChange={() => toggleMetodo(metodo.id)} className="w-4 h-4" />
                                    <span className="text-xl">{metodo.icono}</span>
                                    <span className="font-medium text-gray-800">{metodo.label}</span>
                                </label>
                                {metodoPago.includes(metodo.id) && metodoPago.length > 1 && (
                                    <div className="mt-2 ml-4">
                                        <input
                                            type="number"
                                            placeholder={`Monto en ${metodo.label.toLowerCase()}`}
                                            value={metodo.id === "efectivo" ? montoEfectivo : metodo.id === "transferencia" ? montoTransferencia : montoMP}
                                            onChange={e => {
                                                if (metodo.id === "efectivo") setMontoEfectivo(e.target.value)
                                                else if (metodo.id === "transferencia") setMontoTransferencia(e.target.value)
                                                else setMontoMP(e.target.value)
                                            }}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {metodoPago.length > 1 && (
                        <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${Math.abs(montoPagado() - total) < 0.01 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                            Monto ingresado: ${montoPagado().toFixed(2)} / Total: ${total.toFixed(2)}
                        </div>
                    )}
                </div>

                {/* Notas */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="font-semibold text-gray-800 mb-3">Notas del pedido (opcional)</h2>
                    <textarea
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        rows={3}
                        placeholder="Ej: Dejar en la puerta trasera..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                </div>

                {/* Confirmar */}
                <button
                    onClick={handleConfirmar}
                    disabled={cargando}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                >
                    {cargando ? "Procesando..." : "Confirmar pedido →"}
                </button>
            </div>
        </main>
    )
}