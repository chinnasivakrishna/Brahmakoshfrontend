import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';

export default {
  name: 'AdminProfile',
  setup() {
    const { user, fetchCurrentUser } = useAuth();
    const loading = ref(false);
    const error = ref('');

    onMounted(async () => {
      loading.value = true;
      error.value = '';
      try {
        await fetchCurrentUser('admin');
      } catch (e) {
        console.error('[AdminProfile] Failed to load admin profile:', e);
        error.value = e.message || 'Failed to load profile';
      } finally {
        loading.value = false;
      }
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Admin Profile</h1>

          {loading.value && <p>Loading profile...</p>}
          {error.value && <div class="alert alert-danger">{error.value}</div>}

          {!loading.value && !error.value && user.value && (
            <div>
              <div class="mb-3">
                <strong>Email:</strong> {user.value.email}
              </div>
              {user.value.name && (
                <div class="mb-3">
                  <strong>Name:</strong> {user.value.name}
                </div>
              )}
              <div class="mb-3">
                <strong>Role:</strong> {user.value.role || 'admin'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};


