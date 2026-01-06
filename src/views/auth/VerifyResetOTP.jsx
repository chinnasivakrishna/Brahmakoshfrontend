import { ref, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'VerifyResetOTP',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const email = ref(route.query.email || '');
    const otp = ref('');
    const loading = ref(false);
    const error = ref('');
    const resetToken = ref('');

    onMounted(() => {
      if (!email.value) {
        router.push('/user/forgot-password');
      }
    });

    const handleVerify = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';

      try {
        const response = await api.verifyResetOTP(email.value, otp.value);
        if (response.success && response.data?.resetToken) {
          resetToken.value = response.data.resetToken;
          // Navigate to reset password page
          router.push({
            path: '/user/reset-password',
            query: { email: email.value, token: response.data.resetToken }
          });
        }
      } catch (err) {
        error.value = err.message || 'Invalid or expired OTP. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    const handleResend = async () => {
      loading.value = true;
      error.value = '';

      try {
        await api.resendResetOTP(email.value);
        alert('OTP has been resent to your email.');
      } catch (err) {
        error.value = err.message || 'Failed to resend OTP. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>Verify OTP</h1>
          
          {error.value && <div class="alert alert-danger">{error.value}</div>}
          
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
            Enter the 6-digit OTP sent to <strong>{email.value}</strong>
          </p>
          
          <form onSubmit={handleVerify}>
            <div class="mb-3">
              <label class="form-label">OTP</label>
              <input
                value={otp.value}
                onInput={(e) => otp.value = e.target.value}
                type="text"
                class="form-control"
                required
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                pattern="[0-9]{6}"
                disabled={loading.value}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              />
            </div>
            <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
              {loading.value ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={handleResend}
              disabled={loading.value}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#6366f1', 
                textDecoration: 'underline', 
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Resend OTP
            </button>
          </div>
          
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

