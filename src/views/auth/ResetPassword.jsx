import { ref, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'ResetPassword',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const email = ref(route.query.email || '');
    const resetToken = ref(route.query.token || '');
    const newPassword = ref('');
    const confirmPassword = ref('');
    const loading = ref(false);
    const error = ref('');
    const success = ref(false);

    onMounted(() => {
      if (!email.value || !resetToken.value) {
        router.push('/user/forgot-password');
      }
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      success.value = false;

      // Validate passwords match
      if (newPassword.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        loading.value = false;
        return;
      }

      // Validate password length
      if (newPassword.value.length < 6) {
        error.value = 'Password must be at least 6 characters long';
        loading.value = false;
        return;
      }

      try {
        const response = await api.resetPassword(email.value, resetToken.value, newPassword.value);
        if (response.success) {
          success.value = true;
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/user/login');
          }, 3000);
        }
      } catch (err) {
        error.value = err.message || 'Failed to reset password. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>Reset Password</h1>
          
          {success.value ? (
            <div class="alert alert-success">
              <p style={{ margin: 0 }}>Password reset successfully! Redirecting to login...</p>
            </div>
          ) : (
            <>
              {error.value && <div class="alert alert-danger">{error.value}</div>}
              
              <form onSubmit={handleSubmit}>
                <div class="mb-3">
                  <label class="form-label">New Password</label>
                  <input
                    value={newPassword.value}
                    onInput={(e) => newPassword.value = e.target.value}
                    type="password"
                    class="form-control"
                    required
                    placeholder="Enter new password (min 6 characters)"
                    minLength="6"
                    disabled={loading.value}
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Confirm Password</label>
                  <input
                    value={confirmPassword.value}
                    onInput={(e) => confirmPassword.value = e.target.value}
                    type="password"
                    class="form-control"
                    required
                    placeholder="Confirm new password"
                    minLength="6"
                    disabled={loading.value}
                  />
                </div>
                <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                  {loading.value ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
            <RouterLink to="/user/login" style={{ color: '#6366f1', textDecoration: 'none' }}>
              Back to Login
            </RouterLink>
          </p>
        </div>
      </div>
    );
  }
};

