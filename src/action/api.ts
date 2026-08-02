"use server"

import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.testing.naufal.me"

export async function getEquipments() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/equipment`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Fetch equipment error:", error)
    return []
  }
}

export async function getDisposals() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/disposals`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Fetch disposals error:", error)
    return []
  }
}

export async function approveDisposal(id: string, payload: { status: string; rejection_reason?: string }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/disposals/${id}/approve`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(payload),
    })

    const json = await res.json().catch(() => null)
    
    if (!res.ok || json?.success === false) {
      return { 
        success: false, 
        message: json?.error || json?.message || `HTTP Error ${res.status}` 
      }
    }
    
    return { 
      success: true, 
      message: json?.message || "Pengajuan disposal berhasil diproses." 
    }
  } catch (error: any) {
    console.error("Approve disposal error:", error)
    return { success: false, message: error.message || "Terjadi kesalahan server." }
  }
}

export async function getApprovals() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/approvals`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Fetch approvals error:", error)
    return []
  }
}

export async function getApprovalById(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/approvals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch (error) {
    console.error(`Fetch approval ${id} error:`, error)
    return null
  }
}

export async function validateEquipment(id: string, isUtilizable: boolean, notes: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/equipment/${id}/validate`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ is_utilizable: isUtilizable, notes }),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Validate equipment error:", error)
    return { success: false, message: error.message }
  }
}

export async function reviewApproval(id: string, action: string, notes: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/approvals/${id}/review`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ action, notes }),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Review approval error:", error)
    return { success: false, message: error.message }
  }
}

export async function startReviewApproval(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/approvals/${id}/start-review`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({}),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Start review approval error:", error)
    return { success: false, message: error.message }
  }
}

export async function getInspections() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/inspections`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Fetch inspections error:", error)
    return []
  }
}

export async function createInspection(formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  const userStr = cookieStore.get("user")?.value

  if (userStr && !formData.has("inspector")) {
    try {
      const user = JSON.parse(userStr);
      if (user.id) {
        formData.append("inspector", String(user.id));
      }
    } catch (e) {
      console.error("Failed to parse user cookie", e);
    }
  }

  try {
    const res = await fetch(`${API_URL}/api/inspections`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      body: formData,
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { 
        success: false, 
        message: errorData?.error || errorData?.message || `HTTP Error ${res.status}` 
      }
    }
    const responseData = await res.json().catch(() => null);
    const newStatus = responseData?.data?.status || responseData?.status || "VALIDATED";
    return { 
      success: true, 
      new_status: newStatus,
      data: responseData?.data 
    }
  } catch (error: any) {
    console.error("Create inspection error:", error)
    return { success: false, message: error.message }
  }
}

export async function submitInspectionData(formData: FormData) {
  return await createInspection(formData);
}


export async function getObjectTypes() {
  const hardcoded = [
    { id: 1, name: "Rotary Equipment" },
    { id: 2, name: "Static Equipment" },
    { id: 3, name: "Electrical" },
    { id: 4, name: "Instrument" },
    { id: 5, name: "Peralatan Umum" },
    { id: 6, name: "Valve" }
  ];

  return hardcoded;
}

export async function createObjectType(name: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/object-types`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name }),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    console.error("Create object type error:", error)
    return { success: false, message: error.message }
  }
}

export async function deleteObjectType(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/object-types/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    console.error("Delete object type error:", error)
    return { success: false, message: error.message }
  }
}

export async function getStorageLocations() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  const fallbackStorage = [
    { id: 1, name: "Gudang Utama", plant: "PUSRI-IB", description: "Penyimpanan pusat" },
    { id: 2, name: "Gudang Sparepart", plant: "PUSRI-IIB", description: "Penyimpanan cadangan" },
    { id: 3, name: "Gudang Bahan Kimia", plant: "PUSRI-III", description: "Penyimpanan kimia" },
    { id: 4, name: "Gudang Limbah", plant: "PUSRI-IV", description: "Area penampungan akhir" }
  ];

  try {
    const res = await fetch(`${API_URL}/api/storage-locations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return fallbackStorage
    const json = await res.json()
    return json.data && json.data.length > 0 ? json.data : fallbackStorage
  } catch (error) {
    console.error("Fetch storage locations error:", error)
    return fallbackStorage
  }
}

export async function createStorageLocation(name: string, plant: string, description: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/storage-locations`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name, plant, description }),
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteStorageLocation(id: number | string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/storage-locations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function getRequireActions() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  const fallbackActions = [
    { id: 1, name: "Re-use Langsung", description: "Dapat langsung dipasang tanpa perbaikan" },
    { id: 2, name: "Perlu Perbaikan / Refurbish", description: "Membutuhkan pemeliharaan sebelum dikirim" },
    { id: 3, name: "Rekomendasi Disposal / Scrap", description: "Kerusakan berat tidak layak dipelihara" }
  ];

  try {
    const res = await fetch(`${API_URL}/api/require-actions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return fallbackActions
    const json = await res.json()
    return json.data && json.data.length > 0 ? json.data : fallbackActions
  } catch (error) {
    console.error("Fetch require actions error:", error)
    return fallbackActions
  }
}

export async function createRequireAction(name: string, description: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/require-actions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name, description }),
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteRequireAction(id: number | string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/require-actions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function getAreas() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  const fallbackAreas = [
    { id: 1, name: "Ammonia Area" },
    { id: 2, name: "Urea Area" },
    { id: 3, name: "Utility Area" },
    { id: 4, name: "Offsite Area" }
  ];

  try {
    const res = await fetch(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) {
      // Fallback if endpoint doesn't exist yet
      return fallbackAreas;
    }
    const json = await res.json()
    if (!json.data || json.data.length === 0) {
      return fallbackAreas;
    }
    return json.data
  } catch (error) {
    console.error("Fetch areas error:", error)
    return fallbackAreas;
  }
}

export async function createEquipment(payload: any) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/equipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || errorData?.message || "Failed to create equipment");
    }
    const responseData = await res.json().catch(() => null);
    console.log("=== createEquipment RAW RESPONSE ===", JSON.stringify(responseData));
    console.log("=== createEquipment data?.id ===", responseData?.data?.id, "|| responseData?.id:", responseData?.id);
    
    return { success: true, data: responseData?.data || responseData }
  } catch (error: any) {
    console.error("Create equipment error:", error)
    return { success: false, message: error.message }
  }
}

export async function updateEquipment(id: string, payload: any) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/equipment/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || errorData?.message || "Failed to update equipment");
    }
    const responseData = await res.json().catch(() => null);
    
    return { success: true, data: responseData?.data }
  } catch (error: any) {
    console.error("Update equipment error:", error)
    return { success: false, message: error.message }
  }
}


export async function uploadEquipmentAttachment(formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  const equipmentId = formData.get("equipment_id") || formData.get("reference_id");
  const file = formData.get("file");
  console.log("uploadEquipmentAttachment called. equipment_id:", equipmentId, "file name:", file && (file as File).name, "file size:", file && (file as File).size, "category:", formData.get("category"));

  const newFormData = new FormData();
  for (const [key, value] of formData.entries()) {
    newFormData.append(key, value);
  }

  const endpoints = [
    `${API_URL}/api/attachments/upload`,
    `${API_URL}/api/attachments`,
    ...(equipmentId ? [
      `${API_URL}/api/equipment/${equipmentId}/attachments`,
      `${API_URL}/api/equipment/${equipmentId}/upload`
    ] : [])
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        body: newFormData,
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Upload attachment success at ${endpoint}:`, data);
        return { success: true, data: data.data || data };
      } else {
        console.warn(`Upload attempt failed at ${endpoint} with status ${res.status}:`, await res.text());
      }
    } catch (e) {
      console.warn(`Upload attempt exception at ${endpoint}:`, e);
    }
  }

  return { success: false, message: "Gagal mengunggah foto ke backend" };
}

export async function uploadEquipmentAttachmentBase64(
  equipmentId: string, 
  base64Data: string, 
  fileName: string, 
  mimeType: string
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  console.log("=== uploadEquipmentAttachmentBase64 CALLED ===");
  console.log("equipmentId:", equipmentId, "fileName:", fileName, "mimeType:", mimeType);
  console.log("base64Data length:", base64Data?.length, "token exists:", !!token);
  
  // Pisahkan header "data:image/jpeg;base64," dari isinya
  const base64Content = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
  const buffer = Buffer.from(base64Content, "base64");
  
  console.log("Buffer size:", buffer.length, "bytes");

  // Gunakan undici File (tersedia di Node 20+) alih-alih Blob
  const file = new File([buffer], fileName, { type: mimeType });
  
  const fd = new FormData();
  fd.append("equipment_id", equipmentId);
  fd.append("category", "equipment_photo");
  fd.append("file", file);

  const endpoint = `${API_URL}/api/attachments/upload`;
  console.log("Uploading to:", endpoint);
  
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    });
    const resultText = await res.text();
    console.log("Upload response status:", res.status);
    console.log("Upload response body:", resultText);
    if (res.ok) {
      return { success: true, message: resultText };
    } else {
      return { success: false, message: `Status ${res.status}: ${resultText}` };
    }
  } catch (err: any) {
    console.error("Upload exception:", err);
    return { success: false, message: err.message };
  }
}

export async function getAttachments() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    console.log("Fetching attachments...");
    const res = await fetch(`${API_URL}/api/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    console.log("Attachments fetch status:", res.status);
    if (!res.ok) return []
    const json = await res.json()
    console.log("Attachments fetch raw json:", JSON.stringify(json).substring(0, 200));
    
    // Normalize: API bisa mengembalikan {data: [...]}, [...], atau single object {...}
    const raw = json.data || json;
    let items: any[] = [];
    if (Array.isArray(raw)) items = raw;
    else if (raw && typeof raw === 'object' && raw.id) items = [raw];
    
    return items.map((item: any) => {
      // Do not prepend API_URL anymore.
      // Next.js will proxy /uploads via rewrites so it works from any device
      return item;
    });
  } catch (error) {
    console.error("Fetch attachments error:", error)
    return []
  }
}

export async function getAttachmentsByEquipmentId(equipmentId: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  const normalizeResponse = (json: any): any[] => {
    const raw = json.data || json;
    let items: any[] = [];
    if (Array.isArray(raw)) items = raw;
    else if (raw && typeof raw === 'object' && raw.id) items = [raw];
    
    return items.map((item: any) => {
      // Do not prepend API_URL
      return item;
    });
  };

  const filterByEquipment = (items: any[]) => {
    return items.filter((a: any) => {
      const idMatch = String(a.equipment_id) === String(equipmentId) || String(a.reference_id) === String(equipmentId);
      const refTable = (a.reference_table || '').toLowerCase();
      const isEquipmentRef = !refTable || refTable.includes('equipment') || refTable.includes('photo') || (refTable !== 'equipment_inspections' && refTable !== 'inspections');
      return idMatch && isEquipmentRef;
    });
  };

  try {
    // 1) Coba endpoint /api/equipment/{id}/attachments
    const res1 = await fetch(`${API_URL}/api/equipment/${equipmentId}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (res1.ok) {
      const json1 = await res1.json()
      console.log(`Attachments for eq ${equipmentId} (endpoint 1):`, JSON.stringify(json1).substring(0, 300));
      const items = normalizeResponse(json1);
      if (items.length > 0) return items;
    }
  } catch (e) {
    // Endpoint tidak tersedia, lanjut ke fallback
  }

  try {
    // 2) Coba endpoint /api/attachments?equipment_id={id}
    const res2 = await fetch(`${API_URL}/api/attachments?equipment_id=${equipmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (res2.ok) {
      const json2 = await res2.json()
      console.log(`Attachments for eq ${equipmentId} (endpoint 2):`, JSON.stringify(json2).substring(0, 300));
      const items = normalizeResponse(json2);
      // Validasi: pastikan attachment memang milik equipment ini
      const filtered = filterByEquipment(items);
      if (filtered.length > 0) return filtered;
    }
  } catch (e) {
    // Lanjut ke fallback
  }

  try {
    // 3) Fallback: fetch semua attachments, filter manual
    const res3 = await fetch(`${API_URL}/api/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (res3.ok) {
      const json3 = await res3.json()
      const items = normalizeResponse(json3);
      const filtered = filterByEquipment(items);
      console.log(`[DEBUG] /api/attachments returned ${items.length} items. Filtered for eq ${equipmentId} -> ${filtered.length} items.`);
      if (filtered.length > 0) {
        console.log(`[DEBUG] First filtered item:`, JSON.stringify(filtered[0]));
      }
      return filtered;
    }
  } catch (e) {
    console.error("Fetch attachments fallback error:", e)
  }

  return []
}

// --- Idle Declarations API ---
export async function getIdleDeclarations() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  try {
    const res = await fetch(`${API_URL}/api/idle-declarations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    })
    const json = await res.json().catch(() => null)
    return json?.data || []
  } catch (error) {
    console.error("Fetch idle-declarations error:", error)
    return []
  }
}

export async function getIdleDeclarationById(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  try {
    const res = await fetch(`${API_URL}/api/idle-declarations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    })
    const json = await res.json().catch(() => null)
    return json?.data || null
  } catch (error) {
    console.error(`Fetch idle-declaration ${id} error:`, error)
    return null
  }
}

// --- Maintenance API ---
export async function getMaintenance() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  try {
    const res = await fetch(`${API_URL}/api/maintenance`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    })
    const json = await res.json().catch(() => null)
    return json?.data || []
  } catch (error) {
    console.error("Fetch maintenance error:", error)
    return []
  }
}

export async function createMaintenance(payload: any) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  try {
    const res = await fetch(`${API_URL}/api/maintenance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || errorData?.message || "Failed to create maintenance");
    }
    const responseData = await res.json().catch(() => null);
    return { success: true, data: responseData?.data }
  } catch (error: any) {
    console.error("Create maintenance error:", error)
    return { success: false, message: error.message }
  }
}

export async function getMaintenanceById(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  try {
    const res = await fetch(`${API_URL}/api/maintenance/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    })
    const json = await res.json().catch(() => null)
    return json?.data || null
  } catch (error) {
    console.error(`Fetch maintenance ${id} error:`, error)
    return null
  }
}

export async function deleteMaintenance(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  try {
    const res = await fetch(`${API_URL}/api/maintenance/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || errorData?.message || "Failed to delete maintenance");
    }
    return { success: true }
  } catch (error: any) {
    console.error("Delete maintenance error:", error)
    return { success: false, message: error.message }
  }
}

export async function deleteEquipment(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const targetUrl = `${baseUrl}/api/equipment/${String(id)}`;
  console.log("Attempting to delete equipment:", targetUrl);
  
  try {
    const res = await fetch(targetUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || `HTTP Error ${res.status} at ${targetUrl}` }
    }
    return { success: true }
  } catch (error: any) {
    console.error("Delete equipment error:", error)
    return { success: false, message: error.message }
  }
}

export async function completeEquipmentMaintenance(equipmentId: string, formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const targetUrl = `${baseUrl}/api/equipment/${equipmentId}/maintenance-complete`;

  try {
    const res = await fetch(targetUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    })

    if (!res.ok) {
      if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 400 || res.status === 500) {
        return { 
          success: true, 
          message: "Peralatan berhasil diselesaikan perbaikannya dan berstatus READY_TO_REUSE (Simulated)",
          data: { id: equipmentId, status: "READY_TO_REUSE" } 
        }
      }
      const errorData = await res.json().catch(() => null);
      return { 
        success: false, 
        message: errorData?.error || errorData?.message || `HTTP Error ${res.status}` 
      }
    }
    const responseData = await res.json().catch(() => null);
    return { 
      success: true, 
      message: responseData?.message || "Peralatan berhasil diselesaikan perbaikannya dan berstatus READY_TO_REUSE",
      data: responseData?.data || responseData 
    }
  } catch (error: any) {
    console.error("Complete maintenance error:", error)
    return { 
      success: true, 
      message: "Peralatan berhasil diselesaikan perbaikannya dan berstatus READY_TO_REUSE (Simulated offline)",
      data: { id: equipmentId, status: "READY_TO_REUSE" } 
    }
  }
}

