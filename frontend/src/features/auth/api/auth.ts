import { axiosInstance } from '../../../shared/api/axiosInstance'
import type { LoginPayload, MensajeResponse, RegisterPayload, UserPublic } from '../types'

export async function login({ username, password }: LoginPayload): Promise<MensajeResponse> {
  // Formulario OAuth2 (application/x-www-form-urlencoded). El token llega en la cookie, no en el cuerpo.
  const form = new URLSearchParams({ username, password })
  const { data } = await axiosInstance.post<MensajeResponse>('/auth/token', form)
  return data
}

export async function register(payload: RegisterPayload): Promise<UserPublic> {
  const { data } = await axiosInstance.post<UserPublic>('/auth/register', payload)
  return data
}

export async function logout(): Promise<void> {
  await axiosInstance.post('/auth/logout')
}

export async function getMe(): Promise<UserPublic> {
  const { data } = await axiosInstance.get<UserPublic>('/auth/me')
  return data
}
