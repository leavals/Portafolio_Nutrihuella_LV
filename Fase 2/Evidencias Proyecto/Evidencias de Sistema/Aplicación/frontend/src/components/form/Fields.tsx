import React, { forwardRef, InputHTMLAttributes, SelectHTMLAttributes } from "react";

/** Props comunes */
type BaseProps = {
  label: string;
  error?: string;
  hint?: string;
  id?: string;
  required?: boolean;
};

type TextFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type PasswordFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type DateFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type SelectFieldProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement>;

/* TEXT */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, id, required, className, ...props }, ref) => (
    <label className="block mb-3" htmlFor={id}>
      <span className="label">{label}{required && " *"}</span>
      <input
        ref={ref}
        id={id}
        {...props}
        className={`input ${className ?? ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error && <p id={`${id}-hint`} className="help">{hint}</p>}
      {error && <p id={`${id}-err`} className="help" style={{ color: "var(--nh-danger)" }}>{error}</p>}
    </label>
  )
);
TextField.displayName = "TextField";

/* PASSWORD con toggle */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, hint, id, required, className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    return (
      <label className="block mb-3" htmlFor={id}>
        <span className="label">{label}{required && " *"}</span>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={show ? "text" : "password"}
            {...props}
            className={`input pr-10 ${className ?? ""}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {show ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 8s4 8 8 8 8-2 9-3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
        {hint && !error && <p id={`${id}-hint`} className="help">{hint}</p>}
        {error && <p id={`${id}-err`} className="help" style={{ color: "var(--nh-danger)" }}>{error}</p>}
      </label>
    );
  }
);
PasswordField.displayName = "PasswordField";

/* DATE */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, error, hint, id, required, className, ...props }, ref) => (
    <label className="block mb-3" htmlFor={id}>
      <span className="label">{label}{required && " *"}</span>
      <input
        ref={ref}
        id={id}
        type="date"
        {...props}
        className={`input ${className ?? ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error && <p id={`${id}-hint`} className="help">{hint}</p>}
      {error && <p id={`${id}-err`} className="help" style={{ color: "var(--nh-danger)" }}>{error}</p>}
    </label>
  )
);
DateField.displayName = "DateField";

/* SELECT */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, id, required, className, children, ...props }, ref) => (
    <label className="block mb-3" htmlFor={id}>
      <span className="label">{label}{required && " *"}</span>
      <select
        ref={ref}
        id={id}
        {...props}
        className={`input ${className ?? ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      >
        {children}
      </select>
      {hint && !error && <p id={`${id}-hint`} className="help">{hint}</p>}
      {error && <p id={`${id}-err`} className="help" style={{ color: "var(--nh-danger)" }}>{error}</p>}
    </label>
  )
);
SelectField.displayName = "SelectField";
