import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 120000, // 2 min — generation can take 10-30s
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refresh,
          })
          localStorage.setItem('access_token', data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (email: string, password: string, full_name: string) =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

// Templates
export const templatesApi = {
  list: () => api.get('/templates'),
  get: (id: string) => api.get(`/templates/${id}`),
  preview: (id: string) => api.get(`/templates/${id}/preview`),
  getPreview: (id: string) => api.get(`/templates/${id}/preview`),
}

// Generation
export const generationApi = {
  start: (template_id: string, file: File) => {
    const form = new FormData()
    form.append('template_id', template_id)
    form.append('file', file)
    return api.post('/generate', form)
  },
  status: (job_id: string) => api.get(`/generate/status/${job_id}`),
  generateSync: (prompt: string, slideCount: number, file?: File) => {
    const form = new FormData()
    form.append('prompt', prompt)
    form.append('slide_count', String(slideCount))
    if (file) form.append('file', file)
    return api.post('/generate/sync', form)
  },
}

// Presentations
export const presentationsApi = {
  list: () => api.get('/presentations'),
  get: (id: string) => api.get(`/presentations/${id}`),
  create: (payload: {
    title: string
    description?: string
    slides: object[]
    theme_id: string
    template_id?: string
  }) => api.post('/presentations', payload),
  update: (id: string, payload: object) => api.patch(`/presentations/${id}`, payload),
  delete: (id: string) => api.delete(`/presentations/${id}`),
}

// Export
export const exportApi = {
  start: (presentation_id: string, format: string) =>
    api.post(`/export/${presentation_id}/${format}`),
  status: (job_id: string) => api.get(`/export/jobs/${job_id}`),
  downloadUrl: (job_id: string) => `${BASE_URL}/api/v1/export/download/${job_id}`,
}
