import axios from 'axios'

function getApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const url = configuredUrl.match(/^https?:\/\//) ? configuredUrl : `https://${configuredUrl}`
  const parsedUrl = new URL(url)
  if (!['localhost', '127.0.0.1'].includes(parsedUrl.hostname) && parsedUrl.port === '5000') {
    parsedUrl.port = ''
  }
  return parsedUrl.toString().replace(/\/$/, '')
}

const axiosInstance = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('unfazed_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use((response) => response, (error) => {
  const requestUrl = error.config?.url || ''
  const isAuthRequest = requestUrl.startsWith('/auth/')
  if (error.response?.status === 401 && !isAuthRequest && localStorage.getItem('unfazed_token')) {
    localStorage.removeItem('unfazed_token')
    localStorage.removeItem('unfazed_user')
    window.location.replace('/login')
  }
  return Promise.reject(error)
})

export default axiosInstance