import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';

export default {
  name: 'SuperAdminProfile',
  setup() {
    const { user, fetchCurrentUser } = useAuth();
    const loading = ref(false);
    const error = ref('');

    onMounted(async () => {
      loading.value = true;
      error.value = '';
      try {
        await fetchCurrentUser('super_admin');
      } catch (e) {
        console.error('[SuperAdminProfile] Failed to load super admin profile:', e);
        error.value = e.message || 'Failed to load profile';
      } finally {
        loading.value = false;
      }
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Super Admin Profile</h1>

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
                <strong>Role:</strong> {user.value.role || 'super_admin'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};

