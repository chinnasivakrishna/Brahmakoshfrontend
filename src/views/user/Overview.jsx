import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'UserOverview',
  setup() {
    const stats = ref({
      totalChats: 0,
      totalVoiceCalls: 0
    });

    onMounted(async () => {
      try {
        // You can add a user dashboard API endpoint later
        // const response = await api.getUserDashboard();
        // stats.value = response.data;
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">User Dashboard</h1>
            <RouterLink to="/user/profile" class="btn btn-primary">
              View Profile
            </RouterLink>
          </div>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-subtitle mb-2 text-muted">Welcome</h5>
                  <p class="card-text">Manage your profile and access services from here.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

