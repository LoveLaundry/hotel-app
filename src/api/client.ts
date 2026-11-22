import axios from 'axios'
import { clearSession, getToken } from '../session'
import { createIdempotencyKey, isSafePortalPath, normalizeError } from '../features/feature-pack/utils'

/** Sign-in, session status, and hotel client auth. */
export const authApi = axios.create({
  // Same origin in production: nginx proxies /api/user to user-service.
  baseURL: import.meta.env.VITE_USER_API_URL ?? '/api/user',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/** Operational data (bills, gate passes, linens, ...). */
export const dataApi = axios.create({
  // Same origin in production: nginx proxies /api/bills to bill_service.
  baseURL: import.meta.env.VITE_BILL_API_URL ?? '/api/bills',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

for (const instance of [authApi, dataApi]) {
  instance.interceptors.request.use((config) => {
    const token = getToken()
    // A hotel token is only ever attached to this portal's own endpoints.
    // Laundry-app routes and /today must never receive it, even by accident.
    if (token && isSafePortalPath(config.url ?? '')) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }
    // Hotel writes are idempotent by design: a retry after a timeout must not
    // create a second association switch or duplicate any portal-side action.
    if (config.method === 'post') config.headers['X-Idempotency-Key'] = createIdempotencyKey()
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      // Only 401 means "this session is gone". A 403 means the account exists
      // but may not do this — dropping the session there would sign out a user
      // for opening a page they were never allowed to see.
      if (status === 401) {
        clearSession()
        window.dispatchEvent(new Event('ll_hotel:unauthorized'))
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login')
        }
      }
      return Promise.reject(error)
    },
  )
}

/** HTTP status for an API error, when the server answered at all. */
export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

export function errorMessage(error: unknown): string {
  return normalizeError(error)
}
