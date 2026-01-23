// src/app/lib/auth.ts
import { gql } from './api'

export type User = {
  id: string
  email: string
  name?: string
  role?: string
  isParticipant?: boolean
}

export type AuthResponse = {
  accessToken: string
  user: User
}

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
        isParticipant
      }
    }
  }
`

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
        isParticipant
      }
    }
  }
`

const REFRESH_MUTATION = `
  mutation Refresh {
    refresh {
      accessToken
      user {
        id
        email
        name
        role
        isParticipant
      }
    }
  }
`

const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`

const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      role
      isParticipant
    }
  }
`

export async function login(email: string, password: string) {
  const data = await gql<{ login: AuthResponse }>(LOGIN_MUTATION, {
    input: { email, password },
  })
  return data.login
}

export async function register(payload: { email: string; password: string; name?: string }) {
  const data = await gql<{ register: AuthResponse }>(REGISTER_MUTATION, {
    input: payload,
  })
  return data.register
}

// Refresh uses httpOnly cookie (credentials: include is set in gql())
export async function refresh() {
  const data = await gql<{ refresh: AuthResponse }>(REFRESH_MUTATION)
  return data.refresh
}

// me requires an access token in Authorization header
export async function me(accessToken: string) {
  const data = await gql<{ me: User }>(ME_QUERY, undefined, { accessToken })
  return data.me
}

export async function logout() {
  const data = await gql<{ logout: boolean }>(LOGOUT_MUTATION)
  return { ok: data.logout }
}
