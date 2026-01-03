import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../store/auth.js';

const routes = [
  // Auth Routes - Separate login pages
  {
    path: '/super-admin/login',
    name: 'SuperAdminLogin',
    component: () => import('../views/auth/SuperAdminLogin.jsx'),
    meta: { requiresGuest: true }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/auth/AdminLogin.jsx'),
    meta: { requiresGuest: true }
  },
  {
    path: '/client/login',
    name: 'ClientLogin',
    component: () => import('../views/auth/ClientLogin.jsx'),
    meta: { requiresGuest: true }
  },
  {
    path: '/user/login',
    name: 'UserLogin',
    component: () => import('../views/auth/UserLogin.jsx'),
    meta: { requiresGuest: true }
  },
  // Auth Routes - Separate register pages
  {
    path: '/client/register',
    name: 'ClientRegister',
    component: () => import('../views/auth/ClientRegister.jsx'),
    meta: { requiresGuest: true }
  },
  {
    path: '/user/register',
    name: 'UserRegister',
    component: () => import('../views/auth/UserRegister.jsx'),
    meta: { requiresGuest: true }
  },
  // Mobile User Registration (Multi-step with OTP)
  {
    path: '/mobile/user/register',
    name: 'MobileUserRegister',
    component: () => import('../views/mobile/MobileUserRegister.jsx'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    redirect: '/user/login'
  },
  {
    path: '/dashboard',
    component: () => import('../layouts/DashboardLayout.jsx'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.jsx')
      }
    ]
  },
  // Mobile User Routes (Chat & Voice)
  {
    path: '/mobile/user',
    component: () => import('../layouts/MobileUserLayout.jsx'),
    meta: { requiresAuth: true, requiresRole: 'user' },
    redirect: '/mobile/user/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'MobileUserDashboard',
        component: () => import('../views/mobile/MobileUserDashboard.jsx')
      },
      {
        path: 'chat',
        name: 'MobileChatPage',
        component: () => import('../views/mobile/MobileChatPage.jsx')
      },
      {
        path: 'voice',
        name: 'MobileVoicePage',
        component: () => import('../views/mobile/MobileVoicePage.jsx')
      }
    ]
  },
  // Super Admin routes
  {
    path: '/super-admin',
    component: () => import('../layouts/SuperAdminLayout.jsx'),
    meta: { requiresAuth: true, requiresRole: 'super_admin' },
    redirect: '/super-admin/overview',
    children: [
      {
        path: 'overview',
        name: 'SuperAdminOverview',
        component: () => import('../views/super-admin/Overview.jsx')
      },
      {
        path: 'admins',
        name: 'SuperAdminAdmins',
        component: () => import('../views/super-admin/Admins.jsx')
      },
      {
        path: 'pending-approvals',
        name: 'SuperAdminPendingApprovals',
        component: () => import('../views/super-admin/PendingApprovals.jsx')
      }
    ]
  },
  // Admin routes
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.jsx'),
    meta: { requiresAuth: true, requiresRole: ['admin', 'super_admin'] },
    redirect: '/admin/overview',
    children: [
      {
        path: 'overview',
        name: 'AdminOverview',
        component: () => import('../views/admin/Overview.jsx')
      },
      {
        path: 'clients',
        name: 'AdminClients',
        component: () => import('../views/admin/Clients.jsx')
      },
      {
        path: 'ai-agents',
        name: 'AdminAIAgents',
        component: () => import('../views/admin/AIAgents.jsx')
      },
      {
        path: 'payments',
        name: 'AdminPayments',
        component: () => import('../views/admin/Payments.jsx')
      },
      {
        path: 'credits',
        name: 'AdminCredits',
        component: () => import('../views/admin/Credits.jsx')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.jsx')
      },
      {
        path: 'tools',
        name: 'AdminTools',
        component: () => import('../views/admin/Tools.jsx')
      },
      {
        path: 'support',
        name: 'AdminSupport',
        component: () => import('../views/admin/Support.jsx')
      },
      {
        path: 'health',
        name: 'AdminHealth',
        component: () => import('../views/admin/Health.jsx')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/Settings.jsx')
      }
    ]
  },
  // Client routes
  {
    path: '/client',
    component: () => import('../layouts/ClientLayout.jsx'),
    meta: { requiresAuth: true, requiresRole: ['client', 'admin', 'super_admin'] },
    redirect: '/client/overview',
    children: [
      {
        path: 'overview',
        name: 'ClientOverview',
        component: () => import('../views/client/Overview.jsx')
      },
      {
        path: 'avatar',
        name: 'ClientAvatar',
        component: () => import('../views/client/Avatar.jsx')
      },
      {
        path: 'ai-agents',
        name: 'ClientAIAgents',
        component: () => import('../views/client/AIAgents.jsx')
      },
      {
        path: 'services',
        name: 'ClientServices',
        component: () => import('../views/client/Services.jsx')
      },
      {
        path: 'users',
        name: 'ClientUsers',
        component: () => import('../views/client/Users.jsx')
      },
      {
        path: 'payments',
        name: 'ClientPayments',
        component: () => import('../views/client/Payments.jsx')
      },
      {
        path: 'notifications',
        name: 'ClientNotifications',
        component: () => import('../views/client/Notifications.jsx')
      },
      {
        path: 'support',
        name: 'ClientSupport',
        component: () => import('../views/client/Support.jsx')
      },
      {
        path: 'health',
        name: 'ClientHealth',
        component: () => import('../views/client/Health.jsx')
      },
      {
        path: 'settings',
        name: 'ClientSettings',
        component: () => import('../views/client/Settings.jsx')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.jsx')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Helper function to get role from path
const getRoleFromPath = (path) => {
  if (path.startsWith('/super-admin')) return 'super_admin';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/client')) return 'client';
  if (path.startsWith('/mobile/user')) return 'user'; // Check mobile/user before /user
  if (path.startsWith('/user')) return 'user';
  return null;
};

// Helper function to get role from JWT token
const getRoleFromToken = (token) => {
  try {
    const tokenToCheck = token || localStorage.getItem('token_super_admin') || 
                         localStorage.getItem('token_admin') || 
                         localStorage.getItem('token_client') || 
                         localStorage.getItem('token_user');
    if (tokenToCheck) {
      const tokenParts = tokenToCheck.split('.');
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

// Helper to check if a specific role is authenticated
const isRoleAuthenticated = (role) => {
  if (!role) return false;
  const token = localStorage.getItem(`token_${role}`);
  return !!token;
};

router.beforeEach(async (to, from, next) => {
  const { initializeAuth, getCurrentRole, getTokenForRole } = useAuth();
  
  // Determine the role for the target route
  const targetRole = getRoleFromPath(to.path);
  
  // Handle token from query parameter (for admin login as client)
  if (to.query.token) {
    // Determine role from path or token itself
    const role = targetRole || getRoleFromToken(to.query.token);
    if (role) {
      localStorage.setItem(`token_${role}`, to.query.token);
    }
    // Remove token from URL and continue
    const { token, ...queryWithoutToken } = to.query;
    next({ path: to.path, query: queryWithoutToken, replace: true });
    return;
  }
  
  // Initialize auth state for the target role
  await initializeAuth(targetRole);
  
  // Check authentication for the specific role
  const isAuthForRole = targetRole ? isRoleAuthenticated(targetRole) : false;
  
  if (to.meta.requiresAuth && !isAuthForRole) {
    // Redirect to appropriate login page based on route
    if (to.path.startsWith('/super-admin')) {
      next('/super-admin/login');
    } else if (to.path.startsWith('/admin')) {
      next('/admin/login');
    } else if (to.path.startsWith('/client')) {
      next('/client/login');
    } else {
      next('/user/login');
    }
  } else if (to.meta.requiresGuest && isAuthForRole) {
    // Redirect to appropriate dashboard based on role
    if (targetRole === 'super_admin') {
      next('/super-admin/overview');
    } else if (targetRole === 'admin') {
      next('/admin/overview');
    } else if (targetRole === 'client') {
      next('/client/overview');
    } else if (targetRole === 'user') {
      next('/mobile/user/dashboard'); // Redirect mobile users to mobile dashboard
    } else {
      next('/dashboard');
    }
  } else if (to.meta.requiresRole) {
    const requiredRoles = Array.isArray(to.meta.requiresRole) 
      ? to.meta.requiresRole 
      : [to.meta.requiresRole];
    
    // Check if the target role is in the required roles and authenticated
    if (targetRole && requiredRoles.includes(targetRole) && isAuthForRole) {
      next();
    } else {
      // Redirect based on target role
      if (targetRole === 'super_admin') {
        next('/super-admin/login');
      } else if (targetRole === 'admin') {
        next('/admin/login');
      } else if (targetRole === 'client') {
        next('/client/login');
      } else {
        next('/user/login');
      }
    }
  } else {
    next();
  }
});

export default router;

