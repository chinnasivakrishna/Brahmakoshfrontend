import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';

export default {
  name: 'ClientProfile',
  setup() {
    const { user, fetchCurrentUser } = useAuth();
    const loading = ref(false);
    const error = ref('');

    onMounted(async () => {
      loading.value = true;
      error.value = '';
      try {
        await fetchCurrentUser('client');
      } catch (e) {
        console.error('[ClientProfile] Failed to load client profile:', e);
        error.value = e.message || 'Failed to load profile';
      } finally {
        loading.value = false;
      }
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Client Profile</h1>

          {loading.value && <p>Loading profile...</p>}
          {error.value && <div class="alert alert-danger">{error.value}</div>}

          {!loading.value && !error.value && user.value && (
            <div>
              <div class="mb-3">
                <strong>Email:</strong> {user.value.email}
              </div>
              {user.value.businessName && (
                <div class="mb-3">
                  <strong>Business Name:</strong> {user.value.businessName}
                </div>
              )}
              {user.value.businessType && (
                <div class="mb-3">
                  <strong>Business Type:</strong> {user.value.businessType}
                </div>
              )}
              {user.value.contactNumber && (
                <div class="mb-3">
                  <strong>Contact Number:</strong> {user.value.contactNumber}
                </div>
              )}
              {user.value.address && (
                <div class="mb-3">
                  <strong>Address:</strong> {user.value.address}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
};


