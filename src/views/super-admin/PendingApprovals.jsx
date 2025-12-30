import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'PendingApprovals',
  setup() {
    const pendingUsers = ref([]);
    const loading = ref(false);

    const fetchPendingApprovals = async () => {
      loading.value = true;
      try {
        const response = await api.getPendingApprovals();
        pendingUsers.value = response.data.pendingUsers;
      } catch (error) {
        console.error('Failed to fetch pending approvals:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleApprove = async (type, userId) => {
      try {
        await api.approveLogin(type, userId);
        fetchPendingApprovals();
      } catch (error) {
        alert(error.message || 'Failed to approve login');
      }
    };

    const handleReject = async (type, userId) => {
      if (confirm('Are you sure you want to reject this login request?')) {
        try {
          await api.rejectLogin(type, userId);
          fetchPendingApprovals();
        } catch (error) {
          alert(error.message || 'Failed to reject login');
        }
      }
    };

    onMounted(() => {
      fetchPendingApprovals();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Pending Login Approvals</h1>
          
          {loading.value ? (
            <div class="text-center">Loading...</div>
          ) : pendingUsers.value.length === 0 ? (
            <div class="alert alert-info">No pending approvals</div>
          ) : (
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registered At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.value.map(user => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>
                        <span class="badge bg-secondary">{user.role}</span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span class="badge bg-warning">Pending Approval</span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleApprove(user.type, user._id)} 
                          class="btn btn-success btn-sm me-2"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(user.type, user._id)} 
                          class="btn btn-danger btn-sm"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }
};

