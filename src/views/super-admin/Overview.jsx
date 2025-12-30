import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'SuperAdminOverview',
  setup() {
    const stats = ref({
      totalAdmins: 0,
      activeAdmins: 0,
      totalClients: 0,
      totalUsers: 0,
      pendingApprovals: 0
    });

    onMounted(async () => {
      try {
        const response = await api.getSuperAdminDashboard();
        stats.value = response.data;
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Super Admin Overview</h1>
          <div class="row g-3">
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-subtitle mb-2 text-muted">Total Admins</h5>
                  <h2 class="card-title">{stats.value.totalAdmins}</h2>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-subtitle mb-2 text-muted">Active Admins</h5>
                  <h2 class="card-title">{stats.value.activeAdmins}</h2>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-subtitle mb-2 text-muted">Total Clients</h5>
                  <h2 class="card-title">{stats.value.totalClients}</h2>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-subtitle mb-2 text-muted">Total Users</h5>
                  <h2 class="card-title">{stats.value.totalUsers}</h2>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card bg-warning">
                <div class="card-body">
                  <h5 class="card-subtitle mb-2">Pending Approvals</h5>
                  <h2 class="card-title">{stats.value.pendingApprovals}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
