import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientOverview',
  setup() {
    const stats = ref({
      totalUsers: 0
    });

    onMounted(async () => {
      try {
        const response = await api.getClientDashboard();
        stats.value = response.data;
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Client Overview</h1>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-subtitle mb-2 text-muted">Total Users</h5>
                  <h2 class="card-title">{stats.value.totalUsers}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
