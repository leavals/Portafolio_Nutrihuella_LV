"use client";

import { useForm } from "react-hook-form";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Card, Field, Input, Button } from "@/components/ui";
import { useState } from "react";

<GoogleLoginButton />

type FormData = { email: string; password: string };

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const { loginEmail } = useAuth();
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setErr(null);
    try{
      await loginEmail(data.email, data.password);
      window.location.href = "/dashboard";
    }catch(e:any){
      setErr(e.message ?? "Error");
    }
  });

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email">
            <Input type="email" required {...register("email")} />
          </Field>
          <Field label="Contraseña">
            <Input type="password" required {...register("password")} />
          </Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" className="w-full">Entrar</Button>
        </form>

        <div className="my-4 text-center text-sm text-brand-gray">o</div>
        <GoogleLoginButton />

        <p className="text-sm text-brand-gray mt-4">
          ¿No tienes cuenta? <Link className="text-brand-teal underline" href="/register">Regístrate</Link>
        </p>
      </Card>
    </div>
  );
}
