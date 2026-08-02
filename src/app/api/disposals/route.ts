import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const API_URL = process.env.API_URL || "http://localhost:8080";
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

    // Return dummy initial disposals if backend does not exist / 404 / 500
    return NextResponse.json({
      status: true,
      data: mockDisposals,
    }, { status: 200 });
  } catch (error) {
    console.error("API GET /api/disposals error:", error);
    return NextResponse.json({
      status: true,
      data: mockDisposals,
    }, { status: 200 });
  }
}

const mockDisposals = [
  {
    id: "DSP-2026-001",
    disposal_number: "DSP-2026-001",
    equipment_id: "101",
    equipment_code: "PMP-001-P2B",
    equipment_name: "Centrifugal Pump Heavy Duty A",
    disposal_method: "Scrap (Besi Tua)",
    scrap_value: 12500000,
    book_value: 45000000,
    original_value: 250000000,
    plant: "Pusri IIB (P-IIB)",
    justification: "Hasil inspeksi teknik menyatakan unit mengalami korosi berat dan keretakan struktural pada casing utama (Rusak Berat). Biaya perbaikan melebihi 80% harga unit baru.",
    status: "PENDING",
    created_at: "2026-08-01T09:30:00Z",
    attachments: [
      {
        id: "att-1",
        file_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        caption: "Foto Nameplate Alat"
      },
      {
        id: "att-2",
        file_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
        caption: "Kerusakan Fisik Casing"
      }
    ]
  },
  {
    id: "DSP-2026-002",
    disposal_number: "DSP-2026-002",
    equipment_id: "102",
    equipment_code: "CMP-004-P3",
    equipment_name: "Air Compressor High Pressure B",
    disposal_method: "Lelang",
    scrap_value: 35000000,
    book_value: 75000000,
    original_value: 420000000,
    plant: "Pusri III (P-III)",
    justification: "Rotor dan komponen internal meledak dan tidak dapat diperbaiki. Diusulkan untuk dihapus dari inventaris via skema Lelang terbuka.",
    status: "PENDING",
    created_at: "2026-08-01T14:15:00Z",
    attachments: [
      {
        id: "att-3",
        file_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
        caption: "Nameplate Air Compressor"
      }
    ]
  },
  {
    id: "DSP-2026-003",
    disposal_number: "DSP-2026-003",
    equipment_id: "103",
    equipment_code: "VLV-012-UTL",
    equipment_name: "Control Valve High Pressure 10 Inch",
    disposal_method: "Scrap (Besi Tua)",
    scrap_value: 4500000,
    book_value: 15000000,
    original_value: 85000000,
    plant: "Utility",
    justification: "Valve body retak total dan tidak bisa menahan tekanan presisi (Rusak Berat). Direkomendasikan pembuangan scrap besi tua.",
    status: "PENDING",
    created_at: "2026-08-02T08:00:00Z",
    attachments: [
      {
        id: "att-4",
        file_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
        caption: "Retakan pada Valve Body"
      }
    ]
  }
];
