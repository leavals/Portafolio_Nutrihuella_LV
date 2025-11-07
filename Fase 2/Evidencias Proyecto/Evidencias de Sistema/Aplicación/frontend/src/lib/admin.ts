// src/lib/admin.ts
"use client";

import api from "@/lib/api";

export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  plan?: "BASIC" | "PLUS" | null;
  role?: string | null;
  emailVerifiedAt?: string | null;
  commune?: string | null;
  city?: string | null;
  region?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deactivatedAt?: string | null;
  isSuspended?: boolean | null;
};

export type AdminUserList = {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

export const AdminAPI = {
  async listUsers(params: {
    q?: string;
    page?: number;
    pageSize?: number;
    role?: string;
    plan?: string;
    verified?: string; // "true"/"false"
    commune?: string;
  }) {
    const qs = new URLSearchParams();
    if (params.q) {
      qs.set("q", params.q);
      // compat con back que acepte ?search=
      qs.set("search", params.q);
    }
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.role) qs.set("role", params.role);
    if (params.plan) qs.set("plan", params.plan);
    if (params.verified) qs.set("verified", params.verified);
    if (params.commune) qs.set("commune", params.commune);
    return api.get<AdminUserList>(`/api/admin/users?${qs.toString()}`);
  },

  async getUser(id: string) {
    return api.get<AdminUser>(`/api/admin/users/${id}`);
  },

  async updateUser(
    id: string,
    patch: Partial<AdminUser> & { plan?: "BASIC" | "PLUS"; role?: string; isSuspended?: boolean; deactivated?: boolean }
  ) {
    return api.patch(`/api/admin/users/${id}`, patch);
  },

  async resetPassword(id: string, newPassword?: string) {
    return api.post(`/api/admin/users/${id}/reset-password`, { newPassword });
  },

  async verifyUserEmail(id: string) {
    return api.post(`/api/admin/users/${id}/verify-email`);
  },
};