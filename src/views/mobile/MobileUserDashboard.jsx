import { computed } from 'vue';
import { useAuth } from '../../store/auth.js';
import { useRouter } from 'vue-router';

export default {
  name: 'MobileUserDashboard',
  setup() {
    const router = useRouter();
    const { user } = useAuth();

    const navigateToChat = () => {
      router.push('/mobile/user/chat');
    };

    const navigateToVoice = () => {
      router.push('/mobile/user/voice');
    };

    const navigateToProfile = () => {
      router.push('/mobile/user/profile');
    };

    return () => (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ marginBottom: '10px' }}>Welcome, {user.value?.email || 'User'}!</h1>
            <p style={{ color: '#666' }}>This is your mobile dashboard.</p>
          </div>
          <button
            onClick={navigateToProfile}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            View Profile
          </button>
        </div>
        
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div 
              onClick={navigateToChat}
              style={{
                padding: '30px',
                border: '1px solid #ddd',
                borderRadius: '12px',
                flex: '1',
                minWidth: '250px',
                cursor: 'pointer',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                hover: { transform: 'scale(1.02)' }
              }}
            >
              <h3 style={{ marginTop: 0 }}>💬 Text Chat</h3>
              <p style={{ color: '#666' }}>Start a conversation with AI using text messages.</p>
            </div>
            
            <div 
              onClick={navigateToVoice}
              style={{
                padding: '30px',
                border: '1px solid #ddd',
                borderRadius: '12px',
                flex: '1',
                minWidth: '250px',
                cursor: 'pointer',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
            >
              <h3 style={{ marginTop: 0 }}>🎤 Voice Chat</h3>
              <p style={{ color: '#666' }}>Have a voice-to-voice conversation with AI.</p>
            </div>

            <div 
              onClick={navigateToProfile}
              style={{
                padding: '30px',
                border: '1px solid #ddd',
                borderRadius: '12px',
                flex: '1',
                minWidth: '250px',
                cursor: 'pointer',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
            >
              <h3 style={{ marginTop: 0 }}>👤 My Profile</h3>
              <p style={{ color: '#666' }}>View and manage your profile information.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

