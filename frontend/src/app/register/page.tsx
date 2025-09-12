"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Card, Field, Input, Button } from "@/components/ui";
import { useState } from "react";

type FormData = { name: string; email: string; password: string };

export default function RegisterPage() {
  const { register: r, handleSubmit } = useForm<FormData>();
  const { registerEmail } = useAuth();
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setErr(null);
    try{
      await registerEmail(data.name, data.email, data.password);
      window.location.href = "/dashboard";
    }catch(e:any){
      setErr(e.message ?? "Error");
    }
  });

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-4">Crear cuenta</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nombre">
            <Input required {...r("name")} />
          </Field>
          <Field label="Email">
            <Input type="email" required {...r("email")} />
          </Field>
          <Field label="Contraseña">
            <Input type="password" required {...r("password")} />
          </Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" className="w-full">Registrarme</Button>
        </form>

        <p className="text-sm text-brand-gray mt-4">
          ¿Ya tienes cuenta? <Link className="text-brand-teal underline" href="/login">Inicia sesión</Link>
        </p>
      </Card>
    </div>
  );
}
