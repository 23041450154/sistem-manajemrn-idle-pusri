import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    console.log("=== PROXY UPLOAD: NO TOKEN ===");
    return NextResponse.json({ success: false, message: "Unauthorized - no token" }, { status: 401 });
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.testing.naufal.me";

  console.log("=== PROXY UPLOAD START ===");

  try {
    // Parse incoming FormData from browser
    const incomingFd = await req.formData();

    // Reconstruct FormData for Go backend
    const backendFd = new FormData();

    for (const [key, value] of incomingFd.entries()) {
      if (value instanceof File) {
        // Read file as Buffer and create new Blob with filename
        const buffer = Buffer.from(await value.arrayBuffer());
        console.log(`  File field "${key}": name=${value.name}, size=${buffer.length} bytes, type=${value.type}`);
        backendFd.append(key, new Blob([buffer], { type: value.type }), value.name);
      } else {
        console.log(`  Text field "${key}": ${value}`);
        backendFd.append(key, value as string);
      }
    }

    const endpoint = `${API_URL}/api/attachments/upload`;
    console.log(`  Sending to: ${endpoint}`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFd,
    });

    const responseText = await res.text();
    console.log("=== PROXY UPLOAD RESPONSE ===");
    console.log(`  Status: ${res.status}`);
    console.log(`  Body: ${responseText}`);

    return new Response(responseText, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("=== PROXY UPLOAD ERROR ===", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
