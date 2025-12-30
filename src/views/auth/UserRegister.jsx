import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'UserRegister',
  setup() {
    const router = useRouter();
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

    const professions = [
      { value: '', label: 'Select profession' },
      { value: 'student', label: 'Student' },
      { value: 'private job', label: 'Private Job' },
      { value: 'business', label: 'Business' },
      { value: 'home makers', label: 'Home Makers' },
      { value: 'others', label: 'Others' }
    ];

    const handleRegister = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.userRegister(email.value, password.value, profile.value);
        
        alert(response?.message || 'Registration successful! Please wait for super admin approval to login.');
        router.push('/user/login');
      } catch (err) {
        error.value = err.message || 'Registration failed';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>User Registration</h1>
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
              <label class="form-label">Name</label>
              <input
                value={profile.value.name}
                onInput={(e) => profile.value.name = e.target.value}
                type="text"
                class="form-control"
                placeholder="Enter name"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Date of Birth</label>
              <input
                value={profile.value.dob}
                onInput={(e) => profile.value.dob = e.target.value}
                type="date"
                class="form-control"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Place of Birth</label>
              <input
                value={profile.value.placeOfBirth}
                onInput={(e) => profile.value.placeOfBirth = e.target.value}
                type="text"
                class="form-control"
                placeholder="Enter place of birth"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Time of Birth</label>
              <input
                value={profile.value.timeOfBirth}
                onInput={(e) => profile.value.timeOfBirth = e.target.value}
                type="time"
                class="form-control"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Gowthra</label>
              <input
                value={profile.value.gowthra}
                onInput={(e) => profile.value.gowthra = e.target.value}
                type="text"
                class="form-control"
                placeholder="Enter gowthra"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Profession</label>
              <select
                value={profile.value.profession}
                onChange={(e) => profile.value.profession = e.target.value}
                class="form-select"
              >
                {professions.map(prof => (
                  <option key={prof.value} value={prof.value}>{prof.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
              {loading.value ? 'Registering...' : 'Register'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
              Already have an account? <RouterLink to="/user/login" style={{ color: '#6366f1', textDecoration: 'none' }}>Login here</RouterLink>
            </p>
          </form>
        </div>
      </div>
    );
  }
};


