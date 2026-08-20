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
    const formData = await request.formData();
    
    // Forward the PATCH request to the Go backend API
    const backendRes = await fetch(`${API_URL}/api/maintenance/${id}/complete`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        message: data.message || "Peralatan berhasil diselesaikan perbaikannya dan berstatus READY TO USE",
        data: data.data || data,
      }, { status: 200 });
    }

    // Extract error from backend
    const errorData = await backendRes.json().catch(() => null);
    
    return NextResponse.json({
      success: false,
      message: errorData?.error || errorData?.message || `Gagal memproses perbaikan (HTTP ${backendRes.status})`,
    }, { status: backendRes.status });

  } catch (error: any) {
    console.error("API Route maintenance-complete error:", error);
    return NextResponse.json({
      success: false,
      message: "Gagal terhubung ke backend saat menyelesaikan perbaikan.",
    }, { status: 502 });
  }
}
