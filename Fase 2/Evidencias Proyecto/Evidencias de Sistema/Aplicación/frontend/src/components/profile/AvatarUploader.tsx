"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";

export default function AvatarUploader({
  endpoint,
  onUploaded,
}: {
  endpoint: string;          // p.ej. "/api/users/me/avatar"
  onUploaded?: () => void;   // callback al terminar OK
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // si tu backend espera otro nombre, cámbialo aquí
      await api.post(endpoint, fd); // api ya maneja body FormData
      onUploaded?.();
    } catch (err: any) {
      alert(err?.message || "No se pudo subir el avatar");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        className="btn btn-outline disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Subiendo…" : "Cambiar avatar"}
      </button>
    </>
  );
}
