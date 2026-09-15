import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const api = axios.create({
  baseURL: API_URL,
})

const ACCESS_KEY = 'vedmak.access'
const REFRESH_KEY = 'vedmak.refresh'

export function getTokens() {
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  }
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

api.interceptors.request.use((config) => {
  const { access } = getTokens()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (response?.status !== 401 || config._retried) {
      throw error
    }
    const { refresh } = getTokens()
    if (!refresh) {
      throw error
    }

    config._retried = true
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/token/refresh/`, { refresh })
          .finally(() => {
            refreshPromise = null
          })
      }
      const { data } = await refreshPromise
      setTokens({ access: data.access })
      config.headers.Authorization = `Bearer ${data.access}`
      return api(config)
    } catch (refreshError) {
      clearTokens()
      throw refreshError
    }
  },
)

export function extractErrorMessage(error, fallback = 'Что-то пошло не так, попробуйте ещё раз.') {
  const data = error?.response?.data
  if (!data) return error?.message || fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const value = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]
    return `${firstKey}: ${value}`
  }
  return fallback
}
