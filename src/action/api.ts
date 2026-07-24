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
      return { success: false, message: errorData?.message || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    console.error("Create inspection error:", error)
    return { success: false, message: error.message }
  }
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

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const res = await fetch(`${API_URL}/api/object-types`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return hardcoded;
    const json = await res.json();
    return json.data?.length > 0 ? json.data : hardcoded;
  } catch (error) {
    console.error("Fetch object types error:", error);
    return hardcoded;
  }
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
      throw new Error(errorData?.message || "Failed to create equipment");
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Create equipment error:", error)
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
