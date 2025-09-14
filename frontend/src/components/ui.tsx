// frontend/src/components/ui.tsx
"use client";
import clsx from "clsx";
import React, { cloneElement, isValidElement } from "react";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx(
        "rounded-2xl border bg-white p-4 shadow-soft",
        className
      )}
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "outline" | "ghost" | "danger";
};

export function Button({ asChild, variant = "primary", className, children, ...rest }: ButtonProps) {
  const base =
    variant === "primary" ? "btn btn-primary" :
    variant === "outline" ? "btn btn-outline" :
    variant === "danger"  ? "btn btn-danger"  : "btn btn-ghost";

  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, {
      className: clsx(base, (children as any).props?.className),
    });
  }
  return (
    <button {...rest} className={clsx(base, className)}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={clsx(
        "input",
        className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select {...rest} className={clsx("select", className)} />;
}
