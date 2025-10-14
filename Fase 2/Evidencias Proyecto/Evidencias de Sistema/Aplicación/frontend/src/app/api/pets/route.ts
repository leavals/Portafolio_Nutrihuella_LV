// app/api/pets/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mock
  const pets = [
    { id: "pet_1", name: "Rex", species: "dog", breed: "Mestizo" },
    { id: "pet_2", name: "Misu", species: "cat", breed: "Siames" },
  ];
  return NextResponse.json(pets, { status: 200 });
}
