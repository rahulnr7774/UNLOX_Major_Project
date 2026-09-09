import axios from 'axios'

function getApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const url = configuredUrl.match(/^https?:\/\//) ? configuredUrl : `https://${configuredUrl}`
  return url.replace(/\/$/, '')
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
  if (error.response?.status === 401) localStorage.removeItem('unfazed_token')
  return Promise.reject(error)
})

export default axiosInstance