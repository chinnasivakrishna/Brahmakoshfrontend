import { ref, computed } from 'vue';
import api from '../services/api.js';
import router from '../router/index.js';

// Separate state for each role
const superAdminUser = ref(null);
const superAdminToken = ref(localStorage.getItem('token_super_admin') || null);

const adminUser = ref(null);
const adminToken = ref(localStorage.getItem('token_admin') || null);

const clientUser = ref(null);
const clientToken = ref(localStorage.getItem('token_client') || null);

const userUser = ref(null);
const userToken = ref(localStorage.getItem('token_user') || null);

const loading = ref(false);

// Helper function to get role from path
const getRoleFromPath = (path) => {
  if (path.startsWith('/super-admin')) return 'super_admin';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/client')) return 'client';
  if (path.startsWith('/user')) return 'user';
  return null;
};

// Helper function to get role from JWT token
const getRoleFromToken = (token) => {
  try {
    if (token) {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        return payload.role;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
};

export function useAuth() {
  // Get current role from router or path
  const getCurrentRole = () => {
    const currentPath = router.currentRoute.value?.path || window.location.pathname;
    return getRoleFromPath(currentPath);
  };

  // Get current user and token based on role
  const getCurrentAuth = (role = null) => {
    const currentRole = role || getCurrentRole();
    
    switch (currentRole) {
      case 'super_admin':
        return { user: superAdminUser, token: superAdminToken };
      case 'admin':
        return { user: adminUser, token: adminToken };
      case 'client':
        return { user: clientUser, token: clientToken };
      case 'user':
        return { user: userUser, token: userToken };
      default:
        // Try to find any authenticated role
        if (superAdminToken.value) return { user: superAdminUser, token: superAdminToken, role: 'super_admin' };
        if (adminToken.value) return { user: adminUser, token: adminToken, role: 'admin' };
        if (clientToken.value) return { user: clientUser, token: clientToken, role: 'client' };
        if (userToken.value) return { user: userUser, token: userToken, role: 'user' };
        return { user: ref(null), token: ref(null) };
    }
  };

  // Computed properties for current role
  const currentAuth = computed(() => getCurrentAuth());
  const user = computed(() => currentAuth.value.user?.value);
  const token = computed(() => currentAuth.value.token?.value);
  const userRole = computed(() => {
    const role = getCurrentRole();
    if (role) return role;
    return user.value?.role || currentAuth.value.role;
  });
  
  const isAuthenticated = computed(() => {
    const role = getCurrentRole();
    if (role === 'super_admin') return !!superAdminToken.value;
    if (role === 'admin') return !!adminToken.value;
    if (role === 'client') return !!clientToken.value;
    if (role === 'user') return !!userToken.value;
    // If no specific role, check if any role is authenticated
    return !!(superAdminToken.value || adminToken.value || clientToken.value || userToken.value);
  });

  const isSuperAdmin = computed(() => userRole.value === 'super_admin');
  const isAdmin = computed(() => userRole.value === 'admin');
  const isClient = computed(() => userRole.value === 'client');
  const isUser = computed(() => userRole.value === 'user');

  const login = async (email, password, role) => {
    loading.value = true;
    try {
      let response;
      if (role === 'super_admin') {
        response = await api.superAdminLogin(email, password);
      } else if (role === 'admin') {
        response = await api.adminLogin(email, password);
      } else if (role === 'client') {
        response = await api.clientLogin(email, password);
      } else if (role === 'user') {
        response = await api.userLogin(email, password);
      } else {
        throw new Error('Invalid role');
      }
      
      const tokenValue = response.data.token;
      const userData = response.data.user || response.data.client;
      
      if (userData) {
        userData.role = role; // Ensure role is set
      }

      // Store in role-specific state
      switch (role) {
        case 'super_admin':
          superAdminToken.value = tokenValue;
          superAdminUser.value = userData;
          localStorage.setItem('token_super_admin', tokenValue);
          break;
        case 'admin':
          adminToken.value = tokenValue;
          adminUser.value = userData;
          localStorage.setItem('token_admin', tokenValue);
          break;
        case 'client':
          clientToken.value = tokenValue;
          clientUser.value = userData;
          localStorage.setItem('token_client', tokenValue);
          break;
        case 'user':
          userToken.value = tokenValue;
          userUser.value = userData;
          localStorage.setItem('token_user', tokenValue);
          break;
      }
      
      return response;
    } finally {
      loading.value = false;
    }
  };

  // Firebase authentication methods
  const firebaseLogin = async (idToken, role = 'user') => {
    loading.value = true;
    try {
      const response = await api.firebaseSignIn(idToken);
      
      const tokenValue = response.data.token;
      const userData = response.data.user;
      
      if (userData) {
        userData.role = role;
      }

      // Store in role-specific state (for user role)
      userToken.value = tokenValue;
      userUser.value = userData;
      localStorage.setItem('token_user', tokenValue);
      
      return response;
    } finally {
      loading.value = false;
    }
  };

  const firebaseSignUp = async (idToken) => {
    loading.value = true;
    try {
      const response = await api.firebaseSignUp(idToken);
      return response;
    } finally {
      loading.value = false;
    }
  };

  const register = async (email, password, role, additionalData = {}) => {
    loading.value = true;
    try {
      let response;
      if (role === 'user') {
        response = await api.userRegister(email, password, additionalData.profile || {});
      } else if (role === 'client') {
        response = await api.clientRegister(
          email, 
          password, 
          additionalData.businessName || '',
          additionalData.businessType || '',
          additionalData.contactNumber || '',
          additionalData.address || ''
        );
      }
      
      // Registration no longer logs in automatically - requires approval
      // No token is returned, user needs to wait for approval
      return response;
    } finally {
      loading.value = false;
    }
  };

  const logout = (role = null) => {
    const currentRole = role || getCurrentRole();
    
    // Clear role-specific state
    switch (currentRole) {
      case 'super_admin':
        superAdminToken.value = null;
        superAdminUser.value = null;
        localStorage.removeItem('token_super_admin');
        router.push('/super-admin/login');
        break;
      case 'admin':
        adminToken.value = null;
        adminUser.value = null;
        localStorage.removeItem('token_admin');
        router.push('/admin/login');
        break;
      case 'client':
        clientToken.value = null;
        clientUser.value = null;
        localStorage.removeItem('token_client');
        router.push('/client/login');
        break;
      case 'user':
        userToken.value = null;
        userUser.value = null;
        localStorage.removeItem('token_user');
        router.push('/user/login');
        break;
    }
  };

  const fetchCurrentUser = async (role = null) => {
    const currentRole = role || getCurrentRole();
    const auth = getCurrentAuth(currentRole);
    
    if (!auth.token.value) return;
    
    loading.value = true;
    try {
      let response;
      
      // Use the appropriate endpoint based on role
      if (currentRole === 'super_admin' || currentRole === 'admin') {
        response = await api.getCurrentAdmin(auth.token.value);
      } else if (currentRole === 'client') {
        response = await api.getCurrentClient(auth.token.value);
      } else if (currentRole === 'user') {
        response = await api.getCurrentUser(auth.token.value);
      } else {
        // Try to determine role from token
        const tokenRole = getRoleFromToken(auth.token.value);
        if (tokenRole === 'super_admin' || tokenRole === 'admin') {
          response = await api.getCurrentAdmin(auth.token.value);
        } else if (tokenRole === 'client') {
          response = await api.getCurrentClient(auth.token.value);
        } else {
          response = await api.getCurrentUser(auth.token.value);
        }
      }
      
      const userData = response.data.user;
      // Ensure role is set
      if (userData && !userData.role) {
        userData.role = currentRole || getRoleFromToken(auth.token.value);
      }
      
      // Update role-specific user
      auth.user.value = userData;
      return response;
    } catch (error) {
      // Clear role-specific token on error
      auth.token.value = null;
      auth.user.value = null;
      const storageKey = `token_${currentRole || 'unknown'}`;
      localStorage.removeItem(storageKey);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const initializeAuth = async (role = null) => {
    const currentRole = role || getCurrentRole();
    
    // Initialize all roles from localStorage
    if (!role) {
      // Initialize all roles
      const roles = ['super_admin', 'admin', 'client', 'user'];
      for (const r of roles) {
        const storedToken = localStorage.getItem(`token_${r}`);
        if (storedToken) {
          switch (r) {
            case 'super_admin':
              superAdminToken.value = storedToken;
              break;
            case 'admin':
              adminToken.value = storedToken;
              break;
            case 'client':
              clientToken.value = storedToken;
              break;
            case 'user':
              userToken.value = storedToken;
              break;
          }
        }
      }
    }
    
    // Fetch current user for the specific role if navigating to that role's route
    if (currentRole) {
      const auth = getCurrentAuth(currentRole);
      if (auth.token.value) {
        try {
          await fetchCurrentUser(currentRole);
        } catch (error) {
          console.error(`Failed to fetch current ${currentRole}:`, error);
        }
      }
    }
  };

  // Get token for a specific role (for API calls)
  const getTokenForRole = (role) => {
    switch (role) {
      case 'super_admin':
        return superAdminToken.value;
      case 'admin':
        return adminToken.value;
      case 'client':
        return clientToken.value;
      case 'user':
        return userToken.value;
      default:
        return null;
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated,
    userRole,
    firebaseLogin,
    firebaseSignUp,
    isSuperAdmin,
    isAdmin,
    isClient,
    isUser,
    login,
    register,
    logout,
    fetchCurrentUser,
    initializeAuth,
    getCurrentRole,
    getTokenForRole,
    getCurrentAuth,
    // Expose role-specific states if needed
    superAdminUser,
    adminUser,
    clientUser,
    userUser,
  };
}
