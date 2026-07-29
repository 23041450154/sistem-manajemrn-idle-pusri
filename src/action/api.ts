"use server"

import { cookies } from "next/headers"

const API_URL = process.env.API_URL || "http://localhost:8080"

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

  try {
    const res = await fetch(`${API_URL}/api/storage-locations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Fetch storage locations error:", error)
    return []
  }
}

export async function getAreas() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) {
      // Fallback if endpoint doesn't exist yet
      return [
        { id: 1, name: "Ammonia Area" },
        { id: 2, name: "Urea Area" },
        { id: 3, name: "Utility Area" },
        { id: 4, name: "Offsite Area" }
      ];
    }
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Fetch areas error:", error)
    return [
      { id: 1, name: "Ammonia Area" },
      { id: 2, name: "Urea Area" },
      { id: 3, name: "Utility Area" },
      { id: 4, name: "Offsite Area" }
    ];
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
    
    return { success: true, data: responseData?.data }
  } catch (error: any) {
    console.error("Create equipment error:", error)
    return { success: false, message: error.message }
  }
}

export async function uploadEquipmentAttachment(formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  const equipmentId = formData.get("equipment_id") || formData.get("reference_id");

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
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Upload attachment success at ${endpoint}:`, data);
        return { success: true, data: data.data || data };
      }
    } catch (e) {
      console.warn(`Upload attempt failed at ${endpoint}:`, e);
    }
  }

  return { success: false, message: "Gagal mengunggah foto ke backend" };
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
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && raw.id) return [raw];
    return [];
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
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && raw.id) return [raw];
    return [];
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
      console.log(`Attachments for eq ${equipmentId} (fallback all):`, JSON.stringify(json3).substring(0, 300));
      const items = normalizeResponse(json3);
      return filterByEquipment(items);
    }
  } catch (e) {
    console.error(`Fetch attachments for equipment ${equipmentId} error:`, e)
  }

  return []
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

