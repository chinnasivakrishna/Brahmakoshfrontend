const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get role from path
const getRoleFromPath = (path) => {
  if (path?.startsWith('/super-admin')) return 'super_admin';
  if (path?.startsWith('/admin')) return 'admin';
  if (path?.startsWith('/client')) return 'client';
  if (path?.startsWith('/user')) return 'user';
  return null;
};

// Helper to get token for a specific role
// IMPORTANT: Never fallback to other roles - each role must use its own token
const getTokenForRole = (role) => {
  if (!role) {
    // Try to get role from current path
    const currentPath = window.location.pathname;
    role = getRoleFromPath(currentPath);
  }
  
  if (role) {
    const token = localStorage.getItem(`token_${role}`);
    // Verify token role matches (decode and check)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === role) {
          return token;
        } else {
          console.warn(`[Token Mismatch] Token role (${payload.role}) doesn't match requested role (${role})`);
          return null; // Don't return mismatched token
        }
      } catch (e) {
        // If can't decode, return as-is (might be invalid token)
        return token;
      }
    }
    return null;
  }
  
  // NO FALLBACK - return null if role not specified
  // This prevents using wrong tokens
  return null;
};

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    // Get token from options or determine from endpoint/context
    let token = options.token;
    let tokenSource = 'provided';
    
    if (!token) {
      // Determine role from endpoint
      if (endpoint.includes('/super-admin/') || endpoint.includes('/auth/super-admin/')) {
        token = getTokenForRole('super_admin');
        tokenSource = 'super_admin (endpoint match)';
      } else if (endpoint.includes('/admin/') || endpoint.includes('/auth/admin/')) {
        token = getTokenForRole('admin');
        tokenSource = 'admin (endpoint match)';
      } else if (endpoint.includes('/client/') || endpoint.includes('/auth/client/')) {
        token = getTokenForRole('client');
        tokenSource = 'client (endpoint match)';
      } else if (endpoint.includes('/user/') || endpoint.includes('/auth/user/') || endpoint.includes('/users/') || 
                 endpoint.includes('/mobile/chat') || endpoint.includes('/mobile/voice') || endpoint.includes('/mobile/user/')) {
        // CRITICAL: Mobile endpoints (chat, voice, user profile) MUST use user token ONLY
        // These endpoints are ONLY for 'user' role - NEVER use other tokens
        token = getTokenForRole('user');
        tokenSource = 'user (mobile endpoint - user role required)';
        
        // Verify token is actually a user token
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'user') {
              console.error('[API Error] Wrong token role for mobile endpoint:', {
                endpoint,
                tokenRole: payload.role,
                requiredRole: 'user',
                message: 'Rejecting non-user token for mobile endpoint'
              });
              token = null; // Reject wrong token
              tokenSource = 'rejected (wrong role)';
            }
          } catch (e) {
            console.warn('[API Warning] Could not verify token role:', e);
          }
        }
        
        // Warn if no user token found but other tokens exist
        if (!token) {
          const otherTokens = {
            super_admin: !!localStorage.getItem('token_super_admin'),
            admin: !!localStorage.getItem('token_admin'),
            client: !!localStorage.getItem('token_client')
          };
          const hasOtherTokens = Object.values(otherTokens).some(v => v);
          if (hasOtherTokens) {
            console.error('[API Error]', {
              endpoint,
              message: 'Mobile endpoint requires user token, but user is not logged in. Other roles are logged in. Please logout and login as a user.',
              otherTokens,
              availableTokens: Object.keys(otherTokens).filter(k => otherTokens[k])
            });
          }
        }
      } else {
        // For other endpoints, try to get token from current route
        const currentPath = window.location.pathname;
        const routeRole = getRoleFromPath(currentPath);
        if (routeRole) {
          token = getTokenForRole(routeRole);
          tokenSource = `route-based (${routeRole})`;
        } else {
          // No role detected, no token
          token = null;
          tokenSource = 'none (no role detected)';
        }
      }
    }
    
    // Debug logging
    console.log('[API Request]', {
      endpoint,
      hasToken: !!token,
      tokenSource,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    
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

      // Debug logging for errors
      if (!response.ok) {
        // Check for role mismatch errors
        if (response.status === 403 && data.error === 'INVALID_ROLE') {
          console.error('[API Error - Role Mismatch]', {
            endpoint,
            status: response.status,
            requiredRole: data.requiredRole,
            currentRole: data.currentRole,
            message: data.message,
            hasToken: !!token,
            tokenSource
          });
          
          // Show user-friendly error for role mismatch
          if (data.currentRole && data.requiredRole) {
            const errorMsg = `You are logged in as '${data.currentRole}' but this feature requires '${data.requiredRole}' role. Please logout and login as a user.`;
            console.error('[Role Mismatch]', errorMsg);
            // You can trigger a notification/toast here if needed
          }
        } else {
          console.error('[API Error]', {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            error: data.message || 'Request failed',
            hasToken: !!token,
            responseData: data
          });
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('[API Exception]', {
        endpoint,
        error: error.message,
        hasToken: !!token
      });
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

  // Mobile User Registration (Multi-step with OTP)
  async mobileUserRegisterStep1(email, password) {
    return this.request('/mobile/user/register/step1', {
      method: 'POST',
      body: { email, password },
    });
  }

  async mobileUserRegisterStep1Verify(email, otp) {
    return this.request('/mobile/user/register/step1/verify', {
      method: 'POST',
      body: { email, otp },
    });
  }

  async mobileUserRegisterStep2(email, mobile) {
    return this.request('/mobile/user/register/step2', {
      method: 'POST',
      body: { email, mobile },
    });
  }

  async mobileUserRegisterStep2Verify(email, otp) {
    return this.request('/mobile/user/register/step2/verify', {
      method: 'POST',
      body: { email, otp },
    });
  }

  async mobileUserRegisterStep3(email, profileData, imageFileName, imageContentType) {
    return this.request('/mobile/user/register/step3', {
      method: 'POST',
      body: { 
        email, 
        ...profileData,
        imageFileName,
        imageContentType
      },
    });
  }

  async resendEmailOTP(email) {
    return this.request('/mobile/user/register/resend-email-otp', {
      method: 'POST',
      body: { email },
    });
  }

  async resendMobileOTP(email) {
    return this.request('/mobile/user/register/resend-mobile-otp', {
      method: 'POST',
      body: { email },
    });
  }

  // Mobile User Login (after registration is complete)
  async mobileUserLogin(email, password) {
    return this.request('/auth/user/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  // Firebase Authentication endpoints
  async firebaseSignUp(idToken) {
    return this.request('/mobile/user/register/firebase', {
      method: 'POST',
      body: { idToken },
    });
  }

  async firebaseSignIn(idToken) {
    return this.request('/mobile/user/login/firebase', {
      method: 'POST',
      body: { idToken },
    });
  }

  // Chat APIs
  async createChat(token, title = null) {
    return this.request('/mobile/chat', {
      method: 'POST',
      token,
      body: title ? { title } : {},
    });
  }

  async getChats(token) {
    return this.request('/mobile/chat', {
      method: 'GET',
      token,
    });
  }

  async getChat(chatId, token) {
    return this.request(`/mobile/chat/${chatId}`, {
      method: 'GET',
      token,
    });
  }

  async sendChatMessage(chatId, message, token) {
    return this.request(`/mobile/chat/${chatId}/message`, {
      method: 'POST',
      token,
      body: { message },
    });
  }

  async deleteChat(chatId, token) {
    return this.request(`/mobile/chat/${chatId}`, {
      method: 'DELETE',
      token,
    });
  }

  // Voice APIs
  async startVoiceSession(token, existingChatId = null) {
    return this.request('/mobile/voice/start', {
      method: 'POST',
      token,
      body: existingChatId ? { chatId: existingChatId } : {},
    });
  }

  async processVoice(chatId, audioData, token, audioFormat = 'linear16') {
    return this.request('/mobile/voice/process', {
      method: 'POST',
      token,
      body: {
        chatId,
        audioData,
        audioFormat,
      },
    });
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
