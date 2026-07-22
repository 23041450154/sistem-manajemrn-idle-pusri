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
    if (!res.ok) return { success: false }
    return { success: true }
  } catch (error) {
    console.error("Validate equipment error:", error)
    return { success: false }
  }
}

export async function reviewApproval(id: string, approvalStatus: string, approvalNotes: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/approvals/${id}/review`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ approval_status: approvalStatus, approval_notes: approvalNotes }),
    })
    if (!res.ok) return { success: false }
    return { success: true }
  } catch (error) {
    console.error("Review approval error:", error)
    return { success: false }
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

export async function getObjectTypes() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/object-types`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Fetch object types error:", error)
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
