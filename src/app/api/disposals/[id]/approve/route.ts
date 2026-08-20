import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.testing.naufal.me";
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const body = await request.json().catch(() => ({}));
    const { action, status, rejection_reason, notes } = body;

    // Forward request to backend API
    const backendRes = await fetch(`${API_URL}/api/disposals/${id}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        message: data.message || "Pengajuan disposal berhasil diproses",
        data: data.data || data,
      }, { status: 200 });
    }

    const errorData = await backendRes.json().catch(() => null);

    return NextResponse.json({
      success: false,
      message: errorData?.error || errorData?.message || `Gagal memproses persetujuan disposal (HTTP ${backendRes.status})`,
    }, { status: backendRes.status });

  } catch (error: any) {
    console.error("API Route /api/disposals/[id]/approve error:", error);
    return NextResponse.json({
      success: false,
      message: "Gagal terhubung ke backend saat memproses persetujuan disposal.",
    }, { status: 502 });
  }
}
