import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../../store/auth.js';
import api from '../../services/api.js';

export default {
  name: 'UserLogin',
  setup() {
    const router = useRouter();
    const { login } = useAuth();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    const handleLogin = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        await login(email.value, password.value, 'user');
        router.push('/mobile/user/dashboard');
      } catch (err) {
        error.value = err.message || 'Login failed';
      } finally {
        loading.value = false;
      }
    };

    // Google Sign-In Handler
    const handleGoogleCredential = async (response) => {
      loading.value = true;
      error.value = '';
      try {
        const { data } = await api.post('/api/auth/user/google', {
          idToken: response.credential,
        });
        localStorage.setItem('token_user', data.data.token);
        router.push('/mobile/user/dashboard');
      } catch (e) {
        error.value = e.response?.data?.message || 'Google login failed';
      } finally {
        loading.value = false;
      }
    };

    // Load Google Script
    onMounted(() => {
      loadGoogleScript();
    });
    
    function loadGoogleScript() {
      if (window.google?.accounts?.id) {
        initGoogle();
        return;
      }
    
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', initGoogle);
        return;
      }
    
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        error.value = 'Google Sign-In is temporarily unavailable';
      };
      document.head.appendChild(script);
    }
    
    function initGoogle() {
      if (!window.google?.accounts?.id) {
        console.error('Google Sign-In API not available');
        return;
      }
    
      try {
        window.google.accounts.id.initialize({
          client_id: '449350149768-a1a1qn8siakh4hq7tejj60ri81c6hh85.apps.googleusercontent.com',
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
    
        const buttonDiv = document.getElementById('g_id_signin');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: 340,
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        } else {
          console.error('Google Sign-In button container not found');
        }
      } catch (err) {
        console.error('Google Sign-In initialization error:', err);
        error.value = 'Failed to initialize Google Sign-In';
      }
    }

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>User Login</h1>
          
          {error.value && <div class="alert alert-danger">{error.value}</div>}
          
          <form onSubmit={handleLogin}>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input
                value={email.value}
                onInput={(e) => email.value = e.target.value}
                type="email"
                class="form-control"
                required
                placeholder="Enter user email"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input
                value={password.value}
                onInput={(e) => password.value = e.target.value}
                type="password"
                class="form-control"
                required
                placeholder="Enter password"
              />
            </div>
            <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
              {loading.value ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Google Sign-In Button */}
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280', position: 'relative' }}>
              <span style={{ background: 'white', padding: '0 10px', position: 'relative', zIndex: 1 }}>or</span>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e5e7eb', zIndex: 0 }}></div>
            </div>
            <div id="g_id_signin" style={{ display: 'flex', justifyContent: 'center' }}></div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
            <RouterLink to="/user/forgot-password" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' }}>
              Forgot Password?
            </RouterLink>
          </p>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280' }}>
            Don't have an account?{' '}
            <RouterLink to="/mobile/user/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
              Register
            </RouterLink>
          </p>
        </div>
      </div>
    );
  }
};