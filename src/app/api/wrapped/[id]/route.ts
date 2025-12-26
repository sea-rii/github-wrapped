import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const wrapped = await prisma.wrapped.findUnique({ where: { id } });

    if (!wrapped)
      return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (!wrapped.isPublic) {
      const session = await getSession();
      if (!session)
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });

      if (session.userId !== wrapped.userId)
        return NextResponse.json({ error: "private" }, { status: 403 });
    }

    const payload = {
      id: wrapped.id,
      year: wrapped.year,
      isPublic: wrapped.isPublic,
      createdAt: wrapped.createdAt,
      updatedAt: wrapped.updatedAt,
      ...(wrapped.data as any), // ✅ THIS FIXES MISSING INFO
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("WRAPPED_GET_ERROR:", err);
    return NextResponse.json(
      { error: "wrapped_get_failed", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
