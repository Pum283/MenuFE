export type RoleCode = 'admin' | 'brand'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  userId: string
  email: string
  roles: RoleCode[]
}

