import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "FrostBake",
  description: "Panificados congelados de calidad",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}