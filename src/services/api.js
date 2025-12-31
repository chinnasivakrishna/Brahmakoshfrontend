const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-jfg8.onrender.com/api';

// Helper to get role from path
const getRoleFromPath = (path) => {
  if (path?.startsWith('/super-admin')) return 'super_admin';
  if (path?.startsWith('/admin')) return 'admin';
  if (path?.startsWith('/client')) return 'client';
  if (path?.startsWith('/user')) return 'user';
  return null;
};

// Helper to get token for a specific role
const getTokenForRole = (role) => {
  if (!role) {
    // Try to get role from current path
    const currentPath = window.location.pathname;
    role = getRoleFromPath(currentPath);
  }
  
  if (role) {
    return localStorage.getItem(`token_${role}`);
  }
  
  // Fallback: try to find any token
  return localStorage.getItem('token_super_admin') || 
         localStorage.getItem('token_admin') || 
         localStorage.getItem('token_client') || 
         localStorage.getItem('token_user');
};

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    // Get token from options or determine from endpoint/context
    let token = options.token;
    
    if (!token) {
      // Determine role from endpoint
      if (endpoint.includes('/super-admin/') || endpoint.includes('/auth/super-admin/')) {
        token = getTokenForRole('super_admin');
      } else if (endpoint.includes('/admin/') || endpoint.includes('/auth/admin/')) {
        token = getTokenForRole('admin');
      } else if (endpoint.includes('/client/') || endpoint.includes('/auth/client/')) {
        token = getTokenForRole('client');
      } else if (endpoint.includes('/user/') || endpoint.includes('/auth/user/') || endpoint.includes('/users/')) {
        token = getTokenForRole('user');
      } else {
        // Try to get token from current route
        token = getTokenForRole();
      }
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Remove token from options to avoid sending it in body
    delete config.token;

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Super Admin Auth endpoints
  async superAdminLogin(email, password) {
    return this.request('/auth/super-admin/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  // Admin Auth endpoints
  async adminLogin(email, password) {
    return this.request('/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async getCurrentAdmin(token = null) {
    return this.request('/auth/admin/me', { token });
  }

  // Client Auth endpoints
  async clientLogin(email, password) {
    return this.request('/auth/client/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async clientRegister(email, password, businessName, businessType, contactNumber, address) {
    return this.request('/auth/client/register', {
      method: 'POST',
      body: { email, password, businessName, businessType, contactNumber, address },
    });
  }

  async getCurrentClient(token = null) {
    return this.request('/auth/client/me', { token });
  }

  // User Auth endpoints
  async userLogin(email, password) {
    return this.request('/auth/user/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async userRegister(email, password, profile) {
    return this.request('/auth/user/register', {
      method: 'POST',
      body: { email, password, profile },
    });
  }

  async getCurrentUser(token = null) {
    return this.request('/auth/user/me', { token });
  }

  // Super Admin endpoints
  async getAdmins() {
    return this.request('/super-admin/admins');
  }

  async createAdmin(email, password) {
    return this.request('/super-admin/admins', {
      method: 'POST',
      body: { email, password },
    });
  }

  async updateAdmin(id, data) {
    return this.request(`/super-admin/admins/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAdmin(id) {
    return this.request(`/super-admin/admins/${id}`, {
      method: 'DELETE',
    });
  }

  async getSuperAdminDashboard() {
    return this.request('/super-admin/dashboard/overview');
  }

  async getPendingApprovals() {
    return this.request('/super-admin/pending-approvals');
  }

  async approveLogin(type, userId) {
    return this.request(`/super-admin/approve-login/${type}/${userId}`, {
      method: 'POST',
    });
  }

  async rejectLogin(type, userId) {
    return this.request(`/super-admin/reject-login/${type}/${userId}`, {
      method: 'POST',
    });
  }

  // Admin endpoints
  async getClients() {
    return this.request('/admin/clients');
  }

  async createClient(clientData) {
    return this.request('/admin/clients', {
      method: 'POST',
      body: clientData,
    });
  }

  async getClientLoginToken(clientId) {
    return this.request(`/admin/clients/${clientId}/login-token`, {
      method: 'POST',
    });
  }

  async updateClient(id, data) {
    return this.request(`/admin/clients/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteClient(id) {
    return this.request(`/admin/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async getAdminDashboard() {
    return this.request('/admin/dashboard/overview');
  }

  // Client endpoints
  async getClientUsers() {
    return this.request('/client/users');
  }

  async createClientUser(email, password, profile) {
    return this.request('/client/users', {
      method: 'POST',
      body: { email, password, profile },
    });
  }

  async updateClientUser(id, data) {
    return this.request(`/client/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteClientUser(id) {
    return this.request(`/client/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getClientDashboard() {
    return this.request('/client/dashboard/overview');
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(data) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: data,
    });
  }

  // Upload endpoints
  async getPresignedUrl(fileName, contentType) {
    return this.request('/upload/presigned-url', {
      method: 'POST',
      body: { fileName, contentType },
    });
  }

  async uploadToS3(presignedUrl, file) {
    return fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  }
}

const api = new ApiService();
export default api;
