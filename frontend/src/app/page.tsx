"use client";
import { useForm } from "react-hook-form";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useState } from "react";

type FormData = { email: string; password: string };

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const { loginEmail } = useAuth();
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setErr(null);
    try {
      await loginEmail(data.email, data.password);
      window.location.href = "/dashboard";
    } catch (e: any) { setErr(e.message ?? "Error"); }
  });

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div><label>Email <input type="email" required {...register("email")} /></label></div>
        <div><label>Contraseña <input type="password" required {...register("password")} /></label></div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit">Entrar</button>
      </form>

      <div className="my-4 text-center text-sm">o</div>
      <GoogleLoginButton />

      <p className="text-sm mt-4">¿No tienes cuenta? <Link href="/register">Regístrate</Link></p>
    </div>
  );
}
