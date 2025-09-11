"use client";
import { clsx } from "clsx";

export function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string; }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {help && <p className="help">{help}</p>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("input", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx("select", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("textarea", props.className)} />;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string; }) {
  return <div className={clsx("card p-5", className)}>{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold mb-3">{children}</h2>;
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" | "ghost" }) {
  const v = props.variant ?? "primary";
  const base = v === "primary" ? "btn btn-primary" :
               v === "outline" ? "btn btn-outline" :
               v === "danger" ? "btn btn-danger" : "btn btn-ghost";
  const { className, ...rest } = props;
  return <button {...rest} className={clsx(base, className)} />;
}
