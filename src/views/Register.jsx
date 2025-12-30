import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../store/auth.js';

export default {
  name: 'Register',
  setup() {
    const router = useRouter();
    const { register, userRole } = useAuth();
    const selectedRole = ref('user');
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');
    const profile = ref({
      name: '',
      dob: '',
      placeOfBirth: '',
      timeOfBirth: '',
      gowthra: '',
      profession: ''
    });
    const clientInfo = ref({
      businessName: '',
      businessType: '',
      contactNumber: '',
      address: ''
    });

    const roles = [
      { value: 'user', label: 'User' },
      { value: 'client', label: 'Client' }
    ];

    const handleRegister = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const additionalData = selectedRole.value === 'user' 
          ? { profile: profile.value }
          : { clientInfo: clientInfo.value };
        
        const response = await register(email.value, password.value, selectedRole.value, additionalData);
        
        // Registration successful but needs approval
        alert(response?.message || 'Registration successful! Please wait for super admin approval to login.');
        router.push('/login');
      } catch (err) {
        error.value = err.message || 'Registration failed';
      } finally {
        loading.value = false;
      }
    };

    const updateProfile = (field, value) => {
      profile.value[field] = value;
    };

    const updateClientInfo = (field, value) => {
      clientInfo.value[field] = value;
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>Register</h1>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            {roles.map(role => (
              <button
                key={role.value}
                onClick={() => selectedRole.value = role.value}
                class={`btn ${selectedRole.value === role.value ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ flex: 1 }}
              >
                {role.label}
              </button>
            ))}
          </div>
          
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
                minLength={6}
              />
            </div>
            
            {selectedRole.value === 'user' && (
              <>
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input
                    value={profile.value.name}
                    onInput={(e) => updateProfile('name', e.target.value)}
                    type="text"
                    class="form-control"
                    placeholder="Enter your name"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Date of Birth</label>
                  <input
                    value={profile.value.dob}
                    onInput={(e) => updateProfile('dob', e.target.value)}
                    type="date"
                    class="form-control"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Place of Birth</label>
                  <input
                    value={profile.value.placeOfBirth}
                    onInput={(e) => updateProfile('placeOfBirth', e.target.value)}
                    type="text"
                    class="form-control"
                    placeholder="Enter place of birth"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Time of Birth</label>
                  <input
                    value={profile.value.timeOfBirth}
                    onInput={(e) => updateProfile('timeOfBirth', e.target.value)}
                    type="time"
                    class="form-control"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Gowthra</label>
                  <input
                    value={profile.value.gowthra}
                    onInput={(e) => updateProfile('gowthra', e.target.value)}
                    type="text"
                    class="form-control"
                    placeholder="Enter gowthra"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Profession</label>
                  <select
                    value={profile.value.profession}
                    onChange={(e) => updateProfile('profession', e.target.value)}
                    class="form-select"
                  >
                    <option value="">Select profession</option>
                    <option value="student">Student</option>
                    <option value="private job">Private Job</option>
                    <option value="business">Business</option>
                    <option value="home makers">Home Makers</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </>
            )}
            
            {selectedRole.value === 'client' && (
              <>
                <div class="mb-3">
                  <label class="form-label">Business Name</label>
                  <input
                    value={clientInfo.value.businessName}
                    onInput={(e) => updateClientInfo('businessName', e.target.value)}
                    type="text"
                    class="form-control"
                    placeholder="Enter business name"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Business Type</label>
                  <input
                    value={clientInfo.value.businessType}
                    onInput={(e) => updateClientInfo('businessType', e.target.value)}
                    type="text"
                    class="form-control"
                    placeholder="Enter business type"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Contact Number</label>
                  <input
                    value={clientInfo.value.contactNumber}
                    onInput={(e) => updateClientInfo('contactNumber', e.target.value)}
                    type="tel"
                    class="form-control"
                    placeholder="Enter contact number"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Address</label>
                  <textarea
                    value={clientInfo.value.address}
                    onInput={(e) => updateClientInfo('address', e.target.value)}
                    class="form-control"
                    placeholder="Enter address"
                    rows={3}
                  />
                </div>
              </>
            )}
            
            <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
              {loading.value ? 'Registering...' : 'Register'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
              Already have an account? <RouterLink to="/login" style={{ color: '#6366f1', textDecoration: 'none' }}>Login here</RouterLink>
            </p>
          </form>
        </div>
      </div>
    );
  }
};
