import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'AdminUsers',
  setup() {
    const users = ref([]);

    const fetchUsers = async () => {
      try {
        const response = await api.getAdminUsers();
        users.value = response.data.users;
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    onMounted(() => {
      fetchUsers();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Users</h1>
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-light">
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Created At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.value.map(user => (
                  <tr key={user._id}>
                    <td>{user.email}</td>
                    <td>{user.profile?.name || '-'}</td>
                    <td>{user.clientId?.email || '-'}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span class={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
};
