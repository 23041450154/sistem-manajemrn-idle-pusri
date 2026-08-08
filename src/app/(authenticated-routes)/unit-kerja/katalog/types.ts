/* ponytail: one shared view-model for katalog + detail. The API payload is
   untyped legacy JSON, so normalisation happens once in normalizeEquipment(). */

export type EquipmentState =
  | "registered"
  | "repair"
  | "ready"
  | "rejected"
  | "disposal";

export interface KatalogItem {
  id: string;
  code: string;
  name: string;
  plant: string;
  objectType: string;
  condition: string;
  statusLabel: string;
  state: EquipmentState;
  storageLocation?: string;
  imageUrl?: string;
  estimatedReuseValue?: number;
}

export interface KatalogDetail extends KatalogItem {
  plantDescription?: string;
  funcLoc?: string;
  idleReason?: string;
  idleSince?: string;
  vendor?: string;
  year?: number;
  notes?: string;
  bookValue?: number;
  originalValue?: number;
  images: string[];
}
