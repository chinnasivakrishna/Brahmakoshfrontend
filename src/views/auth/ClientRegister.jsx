import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'ClientRegister',
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const businessName = ref('');
    const businessType = ref('');
    const contactNumber = ref('');
    const address = ref('');
    const loading = ref(false);
    const error = ref('');

    const handleRegister = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.clientRegister(
          email.value, 
          password.value, 
          businessName.value,
          businessType.value,
          contactNumber.value,
          address.value
        );
        
        alert(response?.message || 'Registration successful! You can login now.');
        router.push('/client/login');
      } catch (err) {
        error.value = err.message || 'Registration failed';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>Client Registration</h1>
          {error.value && <div class="alert alert-danger">{error.value}</div>}
          <form onSubmit={handleRegister}>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input
                value={email.value}
                onInput={(e) => email.value = e.target.value}
                type="email"
                class="form-control"
                required
                placeholder="Enter email"
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
            <div class="mb-3">
              <label class="form-label">Business Name</label>
              <input
                value={businessName.value}
                onInput={(e) => businessName.value = e.target.value}
                type="text"
                class="form-control"
                placeholder="Enter business name"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Business Type</label>
              <input
                value={businessType.value}
                onInput={(e) => businessType.value = e.target.value}
                type="text"
                class="form-control"
                placeholder="Enter business type"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Contact Number</label>
              <input
                value={contactNumber.value}
                onInput={(e) => contactNumber.value = e.target.value}
                type="text"
                class="form-control"
                placeholder="Enter contact number"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Address</label>
              <textarea
                value={address.value}
                onInput={(e) => address.value = e.target.value}
                class="form-control"
                rows="3"
                placeholder="Enter address"
              />
            </div>
            <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
              {loading.value ? 'Registering...' : 'Register'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
              Already have an account? <RouterLink to="/client/login" style={{ color: '#6366f1', textDecoration: 'none' }}>Login here</RouterLink>
            </p>
          </form>
        </div>
      </div>
    );
  }
};


