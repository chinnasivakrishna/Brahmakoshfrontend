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

    return () => (
      <div>
        <h1 style={{ marginBottom: '10px' }}>Welcome, {user.value?.email || 'User'}!</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>This is your mobile dashboard.</p>
        
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
          </div>
        </div>
      </div>
    );
  }
};

