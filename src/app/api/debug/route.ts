import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.testing.naufal.me";
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const result: any = {
    API_URL,
    NEXT_PUBLIC_API_URL,
    hasToken: !!token,
    fetchError: null,
    fetchStatus: null,
    fetchOk: false,
    fetchDataLength: 0,
    fetchRawData: null,
  };

  try {
    const res = await fetch(`${API_URL}/api/equipment`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    result.fetchStatus = res.status;
    result.fetchOk = res.ok;
    
    if (res.ok) {
      const json = await res.json();
      result.fetchDataLength = json.data?.length || 0;
      result.fetchRawData = json;
    } else {
      result.fetchRawData = await res.text();
    }
  } catch (error: any) {
    result.fetchError = error.message;
  }

  return NextResponse.json(result);
}
