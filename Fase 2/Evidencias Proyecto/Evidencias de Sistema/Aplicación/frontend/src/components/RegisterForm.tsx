"use client";
/* Cambios mínimos:
   - Tras registro exitoso, redirige a /register/success para mostrar el mensaje.
   - No altera validaciones ni estilos existentes.
*/
import { useMemo, useState } from "react";
import Link from "next/link";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useAuth } from "@/lib/auth-context";

type Issues = { path?: string; message: string }[];

type Props = {
  onSuccess?: () => void;
  showTitle?: boolean;
};

const SPECIALS = `!@#$%^&*()-_=+[]{};:'",.<>/?\`~|\\`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function countMatches(s: string, test: (ch: string) => boolean) {
  let n = 0;
  for (const ch of s) if (test(ch)) n++;
  return n;
}
const hasUpper      = (s: string) => /[A-Z]/.test(s);
const hasDigit      = (s: string) => /\d/.test(s);
const countSpecials = (s: string) => countMatches(s, ch => SPECIALS.includes(ch));

function validatePassword(pw: string) {
  return {
    minLen:   pw.length >= 8,
    specials: countSpecials(pw) >= 2,
    upper:    hasUpper(pw),
    digit:    hasDigit(pw),
  };
}

function strengthInfo(pw: string) {
  const v = validatePassword(pw);
  const okCount = [v.minLen, v.specials, v.upper, v.digit].filter(Boolean).length;
  if (okCount <= 1) return { text: "Fuerza: débil",  width:"w-1/4", color:"bg-red-400"   };
  if (okCount === 2 || (okCount === 3 && pw.length < 12))
                    return { text: "Fuerza: media",  width:"w-1/2", color:"bg-amber-400" };
  return             { text: "Fuerza: alta",   width:"w-full", color:"bg-emerald-500" };
}

export default function RegisterForm({ onSuccess, showTitle=false }: Props) {
  const { registerEmail } = useAuth();

  const [nombre, setNombre]      = useState("");
  const [apellido, setApellido]  = useState("");
  const [email, setEmail]        = useState("");
  const [pw, setPw]              = useState("");
  const [pw2, setPw2]            = useState("");
  const [terms, setTerms]        = useState(false);

  const [showPw, setShowPw]      = useState(false);
  const [showPw2, setShowPw2]    = useState(false);

  const [errors, setErrors]             = useState<{[k:string]:string|null}>({});
  const [serverIssues, setServerIssues] = useState<Issues>([]);
  const [submitting, setSubmitting]     = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const rules   = useMemo(()=>validatePassword(pw), [pw]);
  const pwMatch = pw.length>0 && pw===pw2;
  const allOk   = emailValid && rules.minLen && rules.specials && rules.upper && rules.digit && pwMatch && terms;

  const s = strengthInfo(pw);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({}); setServerIssues([]);
    if (!allOk) {
      setErrors({ form: "Completa los campos y acepta los términos para continuar." });
      return;
    }
    setSubmitting(true);
    try {
      await registerEmail({ name: `${nombre} ${apellido}`.trim(), email, password: pw });
      if (onSuccess) onSuccess();
      else location.assign("/register/success");
    } catch (err: any) {
      setErrors(prev => ({ ...prev, form: err?.message || "No se pudo registrar" }));
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card max-w-xl" aria-describedby="errors" aria-live="polite">
      {showTitle && <h2 className="text-2xl font-semibold text-ink mb-4">Regístrate</h2>}

      <label className="label" htmlFor="nombre">Nombre</label>
      <input id="nombre" className="input mb-3" type="text" placeholder="Ej: Alexander"
             value={nombre} onChange={(e)=>setNombre(e.target.value)} />

      <label className="label" htmlFor="apellido">Apellido</label>
      <input id="apellido" className="input mb-3" type="text" placeholder="Ej: Orell"
             value={apellido} onChange={(e)=>setApellido(e.target.value)} />

      <label className="label" htmlFor="email">Email</label>
      <input id="email" className="input" type="email" required aria-invalid={!emailValid}
             placeholder="tucorreo@dominio.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
      {!emailValid && email.length>0 && (
        <p className="help text-[var(--nh-danger)]">Formato de email inválido</p>
      )}

      <div className="mt-4">
        <label className="label" htmlFor="pw">Contraseña</label>
        <div className="relative">
          <input id="pw" className="input pr-10" type={showPw ? "text" : "password"}
                 value={pw} onChange={(e)=>setPw(e.target.value)} required
                 aria-invalid={!(rules.minLen && rules.specials && rules.upper && rules.digit)}
                 placeholder="Mín. 8; 2 especiales; 1 mayúscula; 1 número" />
          <button type="button" onClick={()=>setShowPw(v=>!v)}
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
            {/* icono inline */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
        </div>

        <ul className="mt-3 space-y-1">
          <li className="flex items-center gap-2"><span>{rules.minLen ? "✅" : "❌"}</span><span>≥ 8 caracteres</span></li>
          <li className="flex items-center gap-2"><span>{rules.specials ? "✅" : "❌"}</span><span>≥ 2 caracteres especiales</span></li>
          <li className="flex items-center gap-2"><span>{rules.upper ? "✅" : "❌"}</span><span>≥ 1 mayúscula</span></li>
          <li className="flex items-center gap-2"><span>{rules.digit ? "✅" : "❌"}</span><span>≥ 1 número</span></li>
        </ul>

        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <span className={`block h-full ${s.width} ${s.color}`} />
          </div>
          <p className="help mt-1">{s.text}</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="pw2">Confirmar contraseña</label>
        <input id="pw2" className="input" type={showPw2 ? "text" : "password"}
               value={pw2} onChange={(e)=>setPw2(e.target.value)} required
               aria-invalid={pw.length>0 && pw!==pw2} placeholder="Repite la contraseña" />
      </div>

      <div className="mt-4 flex items-start gap-2">
        <input id="terms" type="checkbox" checked={terms} onChange={(e)=>setTerms(e.target.checked)} className="mt-1" />
        <label htmlFor="terms" className="text-sm">
          Acepto los <Link href="#" className="underline text-[var(--nh-primary)]">Términos y Condiciones</Link>.
        </label>
      </div>

      <div id="errors" role="status" aria-live="polite" className="mt-3 space-y-1">
        {errors.form && <p className="text-sm text-[var(--nh-danger)]">{errors.form}</p>}
        {serverIssues.length>0 && (
          <ul className="text-sm text-[var(--nh-danger)] list-disc pl-5">
            {serverIssues.map((i,idx)=><li key={idx}>{i.message}</li>)}
          </ul>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="btn btn-primary w-full disabled:opacity-50"
                disabled={!allOk || submitting}>
          {submitting ? "Creando..." : "Crear cuenta"}
        </button>
        <Link href="/login" className="btn btn-outline">Iniciar sesión</Link>
      </div>

      <div className="my-4 flex items-center gap-3 text-sm text-slate-500">
        <span className="flex-1 border-t" />
        <span>o</span>
        <span className="flex-1 border-t" />
      </div>
      <GoogleLoginButton onSuccess={onSuccess} />
    </form>
  );
}
