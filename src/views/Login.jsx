import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../store/auth.js';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const { login, userRole } = useAuth();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    const handleLogin = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        await login(email.value, password.value);
        
        if (userRole.value === 'super_admin') {
          router.push('/super-admin/overview');
        } else if (userRole.value === 'admin') {
          router.push('/admin/overview');
        } else if (userRole.value === 'client') {
          router.push('/client/overview');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        error.value = err.message || 'Login failed';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>Login</h1>
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
                placeholder="Enter your email"
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
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
              {loading.value ? 'Logging in...' : 'Login'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
              Don't have an account? <RouterLink to="/register" style={{ color: '#6366f1', textDecoration: 'none' }}>Register here</RouterLink>
            </p>
          </form>
        </div>
      </div>
    );
  }
};
