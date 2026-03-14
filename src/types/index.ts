export type Rol = "admin" | "cliente" | "repartidor"

export interface Usuario {
    id: string
    email: string
    rol: Rol
    nombre: string
    apellido: string
    telefono?: string
    created_at: string
}

export interface Producto {
    id: string
    nombre: string
    peso_contenido: string
    stock: number
    precio: number
    estado: "hay_stock" | "vencido"
    created_at: string
}

export interface Pedido {
    id: string
    cliente_id: string
    estado: "pendiente" | "en_camino" | "entregado"
    total: number
    metodo_pago: "efectivo" | "transferencia" | "mercadopago" | "combinado"
    created_at: string
}

export interface Repartidor {
    id: string
    nombre: string
    apellido: string
    dni: string
    telefono: string
    fecha_contratacion: string
    email?: string
    usuario_creado: boolean
}

export interface Vehiculo {
    id: string
    patente: string
    marca: string
    modelo: string
    estado: "activo" | "en_reparacion"
}