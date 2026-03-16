import { createClient } from "@/lib/supabase/server"
import UsuariosClient from "./UsuariosClient"

export default async function Usuarios() {
    const supabase = await createClient()

    const { data: usuarios } = await supabase
        .from("perfiles")
        .select("*")
        .order("created_at", { ascending: false })

    return <UsuariosClient usuarios={usuarios ?? []} />
}