import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.testing.naufal.me";
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const backendRes = await fetch(`${API_URL}/api/disposals`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (backendRes.ok) {
      const json = await backendRes.json();
      return NextResponse.json(json, { status: 200 });
    }

    return NextResponse.json({
      status: false,
      data: [],
      message: `Backend disposal mengembalikan HTTP ${backendRes.status}`,
    }, { status: backendRes.status });
  } catch (error) {
    console.error("API GET /api/disposals error:", error);
    return NextResponse.json({
      status: false,
      data: [],
      message: "Gagal mengambil data disposal dari backend",
    }, { status: 502 });
  }
}
