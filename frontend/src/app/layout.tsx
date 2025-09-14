import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "NutriHuella",
  description: "Nutrición natural personalizada para tu mascota",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Providers>
          <Navbar />
          <main className="container py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
