"use client";

/**
 * Barra superior simple, con logo, enlaces y botón "Iniciar sesión".
 * Se alinea a la maqueta (tipografía limpia, colores de marca).
 */
export default function Navbar() {
  return (
    <header className="w-full bg-white/80 backdrop-blur border-b border-black/5">
      <nav className="container-nh py-4 flex items-center justify-between">
        {/* Logo (puedes reemplazar 🐾 por tu SVG) */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-nh-teal grid place-content-center text-white">
            🐾
          </div>
          <span className="text-2xl font-semibold text-nh-dark">NutriHuella</span>
        </div>

        <ul className="hidden md:flex items-center gap-8 text-nh-dark/80">
          <li className="hover:text-nh-dark transition-colors"><a href="#">Inicio</a></li>
          <li className="hover:text-nh-dark transition-colors"><a href="#">Ficha Clínica</a></li>
          <li className="hover:text-nh-dark transition-colors"><a href="#">Recetas</a></li>
        </ul>

        <a href="#login" className="btn-secondary">Iniciar sesión</a>
      </nav>
    </header>
  );
}
