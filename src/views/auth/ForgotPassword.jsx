import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'ForgotPassword',
  setup() {
    const router = useRouter();
    const email = ref('');
    const loading = ref(false);
    const error = ref('');
    const success = ref(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      success.value = false;

      try {
        const response = await api.forgotPassword(email.value);
        if (response.success) {
          success.value = true;
          // Navigate to OTP verification page after 2 seconds
          setTimeout(() => {
            router.push({
              path: '/user/verify-reset-otp',
              query: { email: email.value }
            });
          }, 2000);
        }
      } catch (err) {
        error.value = err.message || 'Failed to send OTP. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>Forgot Password</h1>
          
          {success.value ? (
            <div class="alert alert-success">
              <p style={{ margin: 0 }}>OTP has been sent to your email. Redirecting to verification...</p>
            </div>
          ) : (
            <>
              {error.value && <div class="alert alert-danger">{error.value}</div>}
              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
              <form onSubmit={handleSubmit}>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input
                    value={email.value}
                    onInput={(e) => email.value = e.target.value}
                    type="email"
                    class="form-control"
                    required
                    placeholder="Enter your email"
                    disabled={loading.value}
                  />
                </div>
                <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                  {loading.value ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
            Remember your password?{' '}
            <RouterLink to="/user/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
              Login
            </RouterLink>
          </p>
        </div>
      </div>
    );
  }
};

