// API client with fetch wrapper
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Try to parse JSON error for detailed validation errors
      try {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.detail || response.statusText}`);
      } catch (e) {
        // If parsing fails, fall back to basic error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      // Try to parse JSON error for detailed validation errors
      try {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.detail || response.statusText}`);
      } catch (e) {
        // If parsing fails, fall back to basic error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  },

  patch: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      // Try to parse JSON error for detailed validation errors
      try {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.detail || response.statusText}`);
      } catch (e) {
        // If parsing fails, fall back to basic error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Try to parse JSON error for detailed validation errors
      try {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.detail || response.statusText}`);
      } catch (e) {
        // If parsing fails, fall back to basic error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  },
};
