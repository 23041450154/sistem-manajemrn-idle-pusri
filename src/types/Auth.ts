export interface User {
  id: string | number,
  name: string,
  email: string,
  npp: string,
  role: string,
  createdAt: string,
  updatedAt: string,
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
