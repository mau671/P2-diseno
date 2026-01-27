import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import type { AddressInfo } from 'net'
import { app } from '../app'
import { setSupabaseClientForTest } from '../lib/supabase'

type AuthUserPayload = {
  id: string
  email?: string
  user_metadata?: { full_name?: string }
}

type AuthUserWithMetadata = AuthUserPayload & {
  user_metadata: { full_name?: string }
}

type AuthSessionPayload = {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

type AuthResponsePayload = {
  user: AuthUserPayload
  session: AuthSessionPayload | null
}

type AuthResponseWithSession = {
  user: AuthUserPayload
  session: AuthSessionPayload
}

type SignupResponsePayload = {
  user: AuthUserWithMetadata
  session: null
}

type MeResponsePayload = {
  user: AuthUserPayload | null
}

const parseJson = async <T>(response: Response) => response.json() as Promise<T>

const createSupabaseMock = () => {
  const calls = {
    signUp: [] as unknown[],
    signInWithPassword: [] as unknown[],
    refreshSession: [] as unknown[],
    getUser: [] as unknown[],
    signOut: [] as unknown[]
  }

  const auth = {
    signUp: async (payload: any) => {
      calls.signUp.push(payload)
      return {
        data: {
          user: {
            id: 'user-1',
            email: payload.email,
            user_metadata: payload.options?.data ?? {}
          },
          session: null
        },
        error: null
      }
    },
    signInWithPassword: async ({ email, password }: any) => {
      calls.signInWithPassword.push({ email, password })
      return {
        data: {
          user: { id: 'user-1', email },
          session: {
            access_token: 'access-123',
            refresh_token: 'refresh-123',
            expires_at: 123
          }
        },
        error: null
      }
    },
    refreshSession: async ({ refresh_token }: any) => {
      calls.refreshSession.push({ refresh_token })
      return {
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: {
            access_token: 'new-access',
            refresh_token,
            expires_at: 456
          }
        },
        error: null
      }
    },
    getUser: async (token: string) => {
      calls.getUser.push(token)
      if (token === 'bad-token') {
        return {
          data: { user: null },
          error: { message: 'Invalid token' }
        }
      }
      return {
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      }
    },
    admin: {
      signOut: async (userId: string) => {
        calls.signOut.push(userId)
        return { data: {}, error: null }
      }
    }
  }

  return { client: { auth } as any, calls }
}

let server: ReturnType<typeof app.listen>
let baseUrl: string
let supabaseCalls: ReturnType<typeof createSupabaseMock>['calls']

beforeAll(() => {
  server = app.listen(0)
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  const { client, calls } = createSupabaseMock()
  setSupabaseClientForTest(client)
  supabaseCalls = calls
})

describe('auth endpoints', () => {
  it('signs up a user with email/password', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password', full_name: 'Test User' })
    })

    expect(response.status).toBe(201)
    const payload = await parseJson<SignupResponsePayload>(response)
    expect(payload.user.email).toBe('test@example.com')
    expect(payload.user.user_metadata.full_name).toBe('Test User')
  })

  it('rejects signup without email', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'password' })
    })

    expect(response.status).toBe(400)
  })

  it('logs in with email/password', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    })

    expect(response.status).toBe(200)
    const payload = await parseJson<AuthResponseWithSession>(response)
    expect(payload.session.access_token).toBe('access-123')
  })

  it('rejects login without password', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    })

    expect(response.status).toBe(400)
  })

  it('returns current user when authorized', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { authorization: 'Bearer good-token' }
    })

    expect(response.status).toBe(200)
    const payload = await parseJson<MeResponsePayload>(response)
    if (!payload.user) {
      throw new Error('Expected user in /me response')
    }
    expect(payload.user.id).toBe('user-1')
  })

  it('rejects current user without token', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`)
    expect(response.status).toBe(401)
  })

  it('refreshes a session', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: 'refresh-123' })
    })

    expect(response.status).toBe(200)
    const payload = await parseJson<AuthResponseWithSession>(response)
    expect(payload.session.access_token).toBe('new-access')
  })

  it('rejects refresh without token', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    })

    expect(response.status).toBe(400)
  })

  it('logs out an authenticated user', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { authorization: 'Bearer good-token' }
    })

    expect(response.status).toBe(204)
    expect(supabaseCalls.signOut).toEqual(['user-1'])
  })
})
