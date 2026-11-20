export type Rol = 'user' | 'admin'

/** Espeja el schema UserPublic del backend. */
export interface UserPublic {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
  disabled: boolean
  created_at: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  full_name: string
  email: string
  password: string
}

export interface MensajeResponse {
  message: string
}
