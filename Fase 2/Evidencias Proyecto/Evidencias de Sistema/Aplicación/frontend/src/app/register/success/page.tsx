// src/app/register/success/page.tsx
export default function RegisterSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] grid place-items-center px-4 py-10">
      <div className="max-w-lg w-full rounded-2xl bg-white shadow-2xl p-6">
        <h1 className="text-2xl font-semibold text-ink">Cuenta creada exitosamente</h1>
        <p className="text-slate-600 mt-2">
          Tu cuenta fue creada. Hemos enviado un correo de bienvenida con información útil.
          Ahora puedes iniciar sesión para continuar.
        </p>
        <a href="/login" className="btn btn-primary mt-6 inline-block">Ir a iniciar sesión</a>
      </div>
    </div>
  );
}
