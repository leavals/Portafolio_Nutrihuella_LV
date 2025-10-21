// src/hooks/usePlusUpgrade.ts
'use client';

import api from '@/lib/api';

export default function usePlusUpgrade() {
  async function startUpgrade() {
    // 1) Inicializar transacción en backend
    const res = await api.post<{ url: string; token: string }>('/api/payments/plus/init', {});
    const { url, token } = res;

    // 2) Redirigir via POST con token_ws (recomendado por Transbank)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  }

  return { startUpgrade };
}
