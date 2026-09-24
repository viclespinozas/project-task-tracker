const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// fetch() only rejects on network failure, not on 4xx/5xx responses, so callers
// must check response.ok themselves — this attaches { status, data } to a thrown
// Error so callers can read error.response.status / error.response.data like axios.
async function handleResponse(response) {
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`)
    error.response = { status: response.status, data }
    throw error
  }
  return data
}

export const apiClient = {
  get: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(handleResponse),

  post: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  patch: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  delete: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(handleResponse),
}