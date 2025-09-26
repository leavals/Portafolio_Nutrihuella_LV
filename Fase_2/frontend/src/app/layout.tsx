// src/app/layout.tsx
import './globals.css'
import Navbar from '@/components/Navbar'
import AuthProvider from '@/lib/auth-context' // <-- tu AuthProvider (el archivo que pegaste)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="text-slate-800">
        {/* Fondo + overlay (para el look del mockup) */}
        <div aria-hidden className="fixed inset-0 -z-10 bg-center bg-cover"
             style={{ backgroundImage: "url('/nutrihuella/dog-bg.png')" }} />
        <div className="fixed inset-0 -z-10 bg-black/30" />

        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
