import { ref, computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuth } from '../store/auth.js';
import logo from '../assets/logo.jpeg';

export default {
  name: 'Sidebar',
  setup() {
    const { userRole } = useAuth();
    const route = useRoute();
    const isCollapsed = ref(false);

    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value;
    };

    // Super Admin menu
    const superAdminMenu = [
      { path: '/super-admin/overview', label: 'Overview', icon: '📊' },
      { path: '/super-admin/admins', label: 'Admins', icon: '👥' },
      { path: '/super-admin/pending-approvals', label: 'Pending Approvals', icon: '⏳' }
    ];

    // Admin menu
    const adminMenu = [
      { path: '/admin/overview', label: 'Overview', icon: '📊' },
      { path: '/admin/clients', label: 'Clients', icon: '🏢' },
      { path: '/admin/ai-agents', label: 'AI Agents', icon: '🤖' },
      { path: '/admin/payments', label: 'Payments', icon: '💳' },
      { path: '/admin/credits', label: 'Credits', icon: '⭐' },
      { path: '/admin/users', label: 'Users', icon: '👤' },
      { path: '/admin/tools', label: 'Tools', icon: '🛠️' }
    ];

    const adminFooter = [
      { path: '/admin/support', label: 'Support', icon: '💬' },
      { path: '/admin/health', label: 'Health', icon: '❤️' },
      { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
    ];

    // Client menu
    const clientMenu = [
      { path: '/client/overview', label: 'Overview', icon: '📊' },
      { path: '/client/avatar', label: 'Avatar', icon: '👤' },
      { path: '/client/ai-agents', label: 'AI Agents', icon: '🤖' },
      { path: '/client/services', label: 'Services', icon: '🎯' },
      { path: '/client/users', label: 'Users', icon: '👥' },
      { path: '/client/payments', label: 'Payments', icon: '💳' },
      { path: '/client/notifications', label: 'Notifications', icon: '🔔' }
    ];

    const clientFooter = [
      { path: '/client/support', label: 'Support', icon: '💬' },
      { path: '/client/health', label: 'Health', icon: '❤️' },
      { path: '/client/settings', label: 'Settings', icon: '⚙️' }
    ];

    const menuItems = computed(() => {
      if (userRole.value === 'super_admin') {
        return superAdminMenu;
      } else if (userRole.value === 'admin') {
        return adminMenu;
      } else if (userRole.value === 'client') {
        return clientMenu;
      }
      return [];
    });

    const footerItems = computed(() => {
      if (userRole.value === 'admin') {
        return adminFooter;
      } else if (userRole.value === 'client') {
        return clientFooter;
      }
      return [];
    });

    const portalType = computed(() => {
      if (userRole.value === 'super_admin') {
        return 'Super Admin Portal';
      } else if (userRole.value === 'admin') {
        return 'Admin Portal';
      } else if (userRole.value === 'client') {
        return 'Client Portal';
      } else if (userRole.value === 'user') {
        return 'User Portal';
      }
      return 'Portal';
    });

    const isActive = (itemPath) => {
      return route.path.startsWith(itemPath) || route.path === itemPath;
    };

    const sidebarStyle = {
      width: isCollapsed.value ? '80px' : '260px',
      height: '100vh',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      overflow: 'hidden',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)'
    };

    return () => (
      <aside style={sidebarStyle}>
        <div style={{ padding: isCollapsed.value ? '1rem 0.5rem' : '1rem', borderBottom: '1px solid #2d2d3e', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: isCollapsed.value ? 'center' : 'space-between', alignItems: 'center', marginBottom: isCollapsed.value ? '0.5rem' : '1rem', flexDirection: isCollapsed.value ? 'column' : 'row', gap: isCollapsed.value ? '0.5rem' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: isCollapsed.value ? 0 : 1, justifyContent: isCollapsed.value ? 'center' : 'flex-start', flexDirection: isCollapsed.value ? 'column' : 'row' }}>
              <img 
                src={logo} 
                alt="Brahmakosh Logo" 
                style={{ 
                  width: isCollapsed.value ? '40px' : '50px', 
                  height: isCollapsed.value ? '40px' : '50px', 
                  borderRadius: '8px',
                  objectFit: 'contain',
                  flexShrink: 0
                }} 
              />
              {!isCollapsed.value && (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'white', whiteSpace: 'nowrap' }}>Brahmakosh</h2>
                  <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    {portalType.value}
                  </p>
                </div>
              )}
            </div>
            <button 
              onClick={toggleCollapse} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                fontSize: '1.2rem', 
                cursor: 'pointer', 
                padding: '0.5rem',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isCollapsed.value ? '100%' : 'auto'
              }}
            >
              {isCollapsed.value ? '☰' : '✕'}
            </button>
          </div>
          {isCollapsed.value && (
            <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
              <p style={{ fontSize: '0.65rem', margin: 0, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                {userRole.value === 'super_admin' ? 'Super Admin' : userRole.value === 'admin' ? 'Admin' : userRole.value === 'client' ? 'Client' : 'User'}
              </p>
            </div>
          )}
        </div>
        
        <nav 
          class="sidebar-nav"
          style={{ 
            flex: 1, 
            padding: '1rem 0', 
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style>{`
            .sidebar-nav::-webkit-scrollbar {
              display: none;
            }
            .sidebar-nav {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          {menuItems.value.map(item => (
            <RouterLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed.value ? 'center' : 'flex-start',
                padding: isCollapsed.value ? '1rem 0.5rem' : '1rem 1.5rem',
                color: isActive(item.path) ? '#6366f1' : '#b4b4c0',
                textDecoration: 'none',
                transition: 'all 0.2s',
                borderLeft: isCollapsed.value ? 'none' : `3px solid ${isActive(item.path) ? '#6366f1' : 'transparent'}`,
                background: isActive(item.path) ? '#2d2d3e' : 'transparent',
                minWidth: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '1.2rem', marginRight: isCollapsed.value ? 0 : '1rem', minWidth: '24px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {!isCollapsed.value && <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </RouterLink>
          ))}
        </nav>
        
        <div style={{ borderTop: '1px solid #2d2d3e', padding: '0.5rem 0', minWidth: 0, overflow: 'hidden' }}>
          {footerItems.value.map(item => (
            <RouterLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed.value ? 'center' : 'flex-start',
                padding: isCollapsed.value ? '0.75rem 0.5rem' : '0.75rem 1.5rem',
                color: isActive(item.path) ? '#6366f1' : '#b4b4c0',
                textDecoration: 'none',
                transition: 'all 0.2s',
                borderLeft: isCollapsed.value ? 'none' : `3px solid ${isActive(item.path) ? '#6366f1' : 'transparent'}`,
                background: isActive(item.path) ? '#2d2d3e' : 'transparent',
                minWidth: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '1.2rem', marginRight: isCollapsed.value ? 0 : '1rem', minWidth: '24px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {!isCollapsed.value && <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </RouterLink>
          ))}
        </div>
      </aside>
    );
  }
};
