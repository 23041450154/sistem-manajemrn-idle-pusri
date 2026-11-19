export interface User {
  id: string | number,
  name: string,
  email: string,
  npp: string,
  role: string,
  createdAt: string,
  updatedAt: string,
  inspection_category?: string,
  inspectionCategory?: string,
  inspection_cluster?: string,
  inspectionCluster?: string,
  role_name?: string,
  roleName?: string,
  contact_npp?: string,
  contactNpp?: string,
}

export interface LoginRequest {
  npp: string,
  password: string,
}

export interface LoginResponse {
  status: boolean,
  message:string,
  token: string | null,
  user?: User,
}
