import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'SuperAdminUsers',
  setup() {
    const users = ref([]);
    const loading = ref(false);

    const fetchUsers = async () => {
      loading.value = true;
      try {
        const response = await api.getUsers();
        users.value = response.data.users;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        alert(error.message || 'Failed to fetch users');
      } finally {
        loading.value = false;
      }
    };

    const handleDelete = async (id) => {
      if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
          await api.deleteUser(id);
          alert('User deleted successfully');
          fetchUsers();
        } catch (error) {
          alert(error.message || 'Failed to delete user');
        }
      }
    };

    onMounted(() => {
      fetchUsers();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Users</h1>
            <button onClick={fetchUsers} class="btn btn-secondary" disabled={loading.value}>
              {loading.value ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {loading.value && users.value.length === 0 ? (
            <div class="text-center py-5">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.value.length === 0 ? (
            <div class="text-center py-5">
              <p class="text-muted">No users found</p>
            </div>
          ) : (
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Name</th>
                    <th>Registration Step</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.value.map(user => (
                    <tr key={user._id}>
                      <td>{user.email || '-'}</td>
                      <td>{user.mobile || '-'}</td>
                      <td>{user.profile?.name || '-'}</td>
                      <td>
                        <span class={`badge ${user.registrationStep === 3 ? 'bg-success' : 'bg-warning'}`}>
                          Step {user.registrationStep || 0}/3
                        </span>
                      </td>
                      <td>
                        <span class={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(user._id)} 
                          class="btn btn-danger btn-sm"
                        >
                          Delete
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

