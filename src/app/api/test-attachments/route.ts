import { NextResponse } from "next/server";
import { getAttachmentsByEquipmentId } from "@/action/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eqId = url.searchParams.get("eq_id") || "31";
  
  try {
    const data = await getAttachmentsByEquipmentId(eqId);
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
