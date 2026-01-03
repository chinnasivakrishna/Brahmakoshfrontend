import { RouterView } from 'vue-router';
import { useAuth } from '../store/auth.js';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

export default {
  name: 'MobileUserLayout',
  setup() {
    const router = useRouter();
    const { user, token, logout } = useAuth();
    const activePage = computed(() => {
      const path = router.currentRoute.value.path;
      if (path.includes('/chat')) return 'chat';
      if (path.includes('/voice')) return 'voice';
      return 'home';
    });

    const setActivePage = (page) => {
      if (page === 'home') {
        router.push('/mobile/user/dashboard');
      } else if (page === 'chat') {
        router.push('/mobile/user/chat');
      } else if (page === 'voice') {
        router.push('/mobile/user/voice');
      }
    };

    const handleLogout = async () => {
      await logout('user');
      router.push('/user/login');
    };

    return () => (
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>Brahmakosh</h2>
            <p style={{ fontSize: '12px', opacity: 0.7, margin: '5px 0 0 0' }}>
              {user.value?.email || 'User'}
            </p>
          </div>

          <nav style={{ flex: 1 }}>
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'chat', label: 'Chat', icon: '💬' },
              { id: 'voice', label: 'Voice', icon: '🎤' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: activePage.value === item.id ? '#34495e' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            style={{
              padding: '12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Logout
          </button>
        </div>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '20px', overflow: 'auto', background: '#f5f5f5' }}>
          <RouterView />
        </main>
      </div>
    );
  }
};

