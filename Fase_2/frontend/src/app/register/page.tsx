// frontend/src/app/register/page.tsx
"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type Issues = { path?: string; message: string }[];

const SPECIALS = `!@#$%^&*()-_=+[]{};:'",.<>/?\`~|\\`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function countMatches(s: string, test: (ch: string) => boolean) {
  let n = 0;
  for (const ch of s) if (test(ch)) n++;
  return n;
}
function hasUpper(s: string) { return /[A-Z]/.test(s); }
function hasDigit(s: string) { return /\d/.test(s); }
function countSpecials(s: string) { return countMatches(s, ch => SPECIALS.includes(ch)); }

/** Valida la contraseña con las 4 reglas:
 *  - ≥ 8 caracteres
 *  - ≥ 2 especiales (del conjunto indicado)
 *  - ≥ 1 mayúscula
 *  - ≥ 1 dígito
 */
function validatePassword(pw: string) {
  return {
    minLen: pw.length >= 8,
    specials: countSpecials(pw) >= 2,
    upper: hasUpper(pw),
    digit: hasDigit(pw),
  };
}

function strengthLabel(pw: string) {
  const v = validatePassword(pw);
  const okCount = [v.minLen, v.specials, v.upper, v.digit].filter(Boolean).length;
  if (okCount <= 1) return { cls: "strength strength-weak", text: "Fuerza: débil" };
  if (okCount === 2 || (okCount === 3 && pw.length < 12)) return { cls: "strength strength-mid", text: "Fuerza: media" };
  return { cls: "strength strength-strong", text: "Fuerza: alta" };
}

export default function RegistroUsuario() {
  // Campos
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [terms, setTerms] = useState(false);

  // Visibilidad
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // Errores del backend / front
  const [errors, setErrors] = useState<{ [k: string]: string | null }>({});
  const [serverIssues, setServerIssues] = useState<Issues>([]);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const rules = useMemo(() => validatePassword(pw), [pw]);
  const pwMatch = pw.length > 0 && pw === pw2;
  const allOk = emailValid && rules.minLen && rules.specials && rules.upper && rules.digit && pwMatch && terms;

  const s = strengthLabel(pw);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerIssues([]);
    if (!allOk) {
      setErrors({
        form: "Completa los campos y acepta los términos para continuar.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const body = { name: `${nombre} ${apellido}`.trim() || undefined, email, password: pw };
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      let data: any;
      try { data = JSON.parse(raw); } catch { data = raw; }

      if (!res.ok) {
        // Tu backend devuelve { message: 'Validación fallida', issues: [...] }
        if (data?.issues) setServerIssues(data.issues);
        const msg = data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // Éxito
      if (data?.token) localStorage.setItem("token", data.token);
      alert("✅ Cuenta creada con éxito");
      setNombre(""); setApellido(""); setEmail(""); setPw(""); setPw2(""); setTerms(false);
      // Opcional: redirige
      // location.assign("/dashboard");
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, form: err?.message || "No se pudo registrar" }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Crear cuenta</h1>
      <p className="text-slate-600 mb-6">
        Regístrate para comenzar con la huella nutricional de tu mascota.
      </p>

      <form onSubmit={onSubmit} noValidate className="card max-w-xl" aria-describedby="errors" aria-live="polite">
        {/* Nombre */}
        <label className="label" htmlFor="nombre">Nombre</label>
        <input
          id="nombre" className="input mb-3" type="text" placeholder="Ej: Alexander"
          value={nombre} onChange={(e)=>setNombre(e.target.value)}
        />

        {/* Apellido */}
        <label className="label" htmlFor="apellido">Apellido</label>
        <input
          id="apellido" className="input mb-3" type="text" placeholder="Ej: Orell"
          value={apellido} onChange={(e)=>setApellido(e.target.value)}
        />

        {/* Email */}
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email" className="input" type="email" required aria-invalid={!emailValid}
          placeholder="tucorreo@dominio.com" value={email} onChange={(e)=>setEmail(e.target.value)}
        />
        {!emailValid && email.length > 0 && (
          <p className="help text-[var(--nh-danger)]">Formato de email inválido</p>
        )}

        {/* Contraseña */}
        <div className="mt-4">
          <label className="label" htmlFor="pw">Contraseña</label>
          <div className="relative">
            <input
              id="pw" className="input pr-10" type={showPw ? "text" : "password"}
              value={pw} onChange={(e)=>setPw(e.target.value)} required aria-invalid={!(rules.minLen && rules.specials && rules.upper && rules.digit)}
              placeholder="Mín. 8; 2 especiales; 1 mayúscula; 1 número"
            />
            <button type="button" onClick={()=>setShowPw(v=>!v)}
              aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {/* icono ojo simple */}
              {showPw ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-3.4M4.5 4.5C2.3 6 1 8 1 8s4 8 11 8c2.1 0 3.9-.6 5.4-1.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
          </div>

          {/* Checklist dinámico */}
          <ul className="mt-3 space-y-1">
            <li className="rule">
              <span className={rules.minLen ? "ok" : "fail"}>{rules.minLen ? "✅" : "❌"}</span>
              <span>≥ 8 caracteres</span>
            </li>
            <li className="rule">
              <span className={rules.specials ? "ok" : "fail"}>{rules.specials ? "✅" : "❌"}</span>
              <span>≥ 2 caracteres especiales</span>
            </li>
            <li className="rule">
              <span className={rules.upper ? "ok" : "fail"}>{rules.upper ? "✅" : "❌"}</span>
              <span>≥ 1 mayúscula</span>
            </li>
            <li className="rule">
              <span className={rules.digit ? "ok" : "fail"}>{rules.digit ? "✅" : "❌"}</span>
              <span>≥ 1 número</span>
            </li>
          </ul>

          {/* Indicador de fuerza */}
          <div className="mt-3">
            <div className={s.cls}><span /></div>
            <p className="help mt-1">{s.text}</p>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div className="mt-4">
          <label className="label" htmlFor="pw2">Confirmar contraseña</label>
          <div className="relative">
            <input
              id="pw2" className="input pr-10" type={showPw2 ? "text" : "password"}
              value={pw2} onChange={(e)=>setPw2(e.target.value)} required aria-invalid={pw.length>0 && !pwMatch}
              placeholder="Repite la contraseña"
            />
            <button type="button" onClick={()=>setShowPw2(v=>!v)}
              aria-label={showPw2 ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {/* mismo icono ojo */}
              {showPw2 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-3.4M4.5 4.5C2.3 6 1 8 1 8s4 8 11 8c2.1 0 3.9-.6 5.4-1.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
          </div>
          {pw.length>0 && (
            <p className={`help ${pwMatch ? "text-[var(--nh-success)]" : "text-[var(--nh-danger)]"}`}>
              {pwMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
            </p>
          )}
        </div>

        {/* Términos */}
        <div className="mt-4 flex items-start gap-2">
          <input id="terms" type="checkbox" checked={terms} onChange={(e)=>setTerms(e.target.checked)} className="mt-1" />
          <label htmlFor="terms" className="text-sm">
            Acepto los <Link href="#" className="underline text-[var(--nh-primary)]">Términos y Condiciones</Link>.
          </label>
        </div>

        {/* Errores */}
        <div id="errors" role="status" aria-live="polite" className="mt-3 space-y-1">
          {errors.form && <p className="text-sm text-[var(--nh-danger)]">{errors.form}</p>}
          {serverIssues.length>0 && (
            <ul className="text-sm text-[var(--nh-danger)] list-disc pl-5">
              {serverIssues.map((i,idx)=><li key={idx}>{i.message}</li>)}
            </ul>
          )}
        </div>

        {/* Botones */}
        <div className="mt-6 flex gap-3">
          <button type="submit" className="btn btn-primary w-full disabled:opacity-50"
                  disabled={!allOk || submitting}>
            {submitting ? "Creando..." : "Crear cuenta"}
          </button>
          <Link href="/login" className="btn btn-outline">Iniciar sesión</Link>
        </div>
      </form>

      {/* Casos de prueba simples (se corren solo en dev) */}
      {process.env.NODE_ENV !== "production" && (
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            const pass = (s)=>({minLen:s.length>=8, specials:(s.match(/[!@#$%^&*()\\-_=+\\[\\]{};:'",.<>\\/\\?\\\`~|\\\\]/g)||[]).length>=2, upper:/[A-Z]/.test(s), digit:/\\d/.test(s)});
            const cases = [
              ["Abcdefg1!!", true],
              ["Abcdefg1!", false],
              ["abcdefg1!!", false],
              ["ABCDEFG!!", false],
              ["Ab1!", false],
              ["AA11!!aa", true],
              ["Z9@#Z9@#", true],
            ];
            cases.forEach(([pw, ok])=>{
              const v=pass(pw); const all=v.minLen&&v.specials&&v.upper&&v.digit;
              console.assert(all===ok, "Caso contraseña", pw, "esperado:", ok, "->", v);
            });
          })();`
        }} />
      )}
    </>
  );
}
