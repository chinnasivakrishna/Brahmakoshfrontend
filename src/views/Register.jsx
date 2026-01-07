import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../store/auth.js';
import api from '../services/api.js';

export default {
  name: 'Register',
  setup() {
    const router = useRouter();
    const { register, userRole, login, getTokenForRole } = useAuth();
    const step = ref(1);
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

    const imageFile = ref(null);

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

        // After successful registration, automatically log in the user
        try {
          await login(email.value, password.value, selectedRole.value);
        } catch (loginErr) {
          console.warn('[Register] Auto-login after register failed:', loginErr);
        }

        if (selectedRole.value === 'user') {
          // Go to image upload step for user role
          alert(response?.message || 'Registration successful! Now upload your profile image.');
          step.value = 2;
        } else {
          // For client and other roles, keep existing behavior
          alert(response?.message || 'Registration successful! Please wait for super admin approval to login.');
          router.push('/login');
        }
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

    const handleImageUpload = async (e) => {
      e.preventDefault();
      if (!imageFile.value) {
        error.value = 'Please select an image';
        return;
      }
      loading.value = true;
      error.value = '';

      try {
        const formData = new FormData();
        formData.append('image', imageFile.value);

        // Use user token for mobile/profile endpoints
        const token = getTokenForRole('user');
        if (!token) {
          throw new Error('User is not logged in. Please login and try again.');
        }

        const response = await api.updateUserProfileWithImage(formData, token);

        alert(response?.message || 'Profile image uploaded successfully!');
        // After image upload, redirect to login so user can proceed normally
        router.push('/login');
      } catch (err) {
        console.error('[Register] Image upload error:', err);
        error.value = err.message || 'Image upload failed';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '1rem' }}>
            {step.value === 1 ? 'Register' : 'Upload Profile Image'}
          </h1>
          {step.value === 1 && (
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
          )}
          
          {error.value && <div class="alert alert-danger">{error.value}</div>}

          {step.value === 1 && (
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
          )}

          {step.value === 2 && (
            <form onSubmit={handleImageUpload}>
              <div class="mb-3">
                <label class="form-label">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  class="form-control"
                  onChange={(e) => { imageFile.value = e.target.files[0]; }}
                  required
                />
              </div>
              <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                {loading.value ? 'Uploading...' : 'Upload Image'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
                You can also skip this step and upload later from your profile.
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }
};
