import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'SuperAdminAdmins',
  setup() {
    const admins = ref([]);
    const showCreateModal = ref(false);
    const newAdmin = ref({ email: '', password: '' });

    const fetchAdmins = async () => {
      try {
        const response = await api.getAdmins();
        admins.value = response.data.admins;
      } catch (error) {
        console.error('Failed to fetch admins:', error);
      }
    };

    const handleCreate = async (e) => {
      e.preventDefault();
      try {
        await api.createAdmin(newAdmin.value.email, newAdmin.value.password);
        showCreateModal.value = false;
        newAdmin.value = { email: '', password: '' };
        fetchAdmins();
      } catch (error) {
        alert(error.message || 'Failed to create admin');
      }
    };

    const handleDelete = async (id) => {
      if (confirm('Are you sure you want to delete this admin?')) {
        try {
          await api.deleteAdmin(id);
          fetchAdmins();
        } catch (error) {
          alert(error.message || 'Failed to delete admin');
        }
      }
    };

    onMounted(() => {
      fetchAdmins();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Admins</h1>
            <button onClick={() => showCreateModal.value = true} class="btn btn-primary">Add Admin</button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-light">
                <tr>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.value.map(admin => (
                  <tr key={admin._id}>
                    <td>{admin.email}</td>
                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span class={`badge ${admin.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(admin._id)} class="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showCreateModal.value && (
            <div 
              class="modal show d-block" 
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => showCreateModal.value = false}
            >
              <div class="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Create Admin</h5>
                    <button type="button" class="btn-close" onClick={() => showCreateModal.value = false}></button>
                  </div>
                  <form onSubmit={handleCreate}>
                    <div class="modal-body">
                      <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input
                          value={newAdmin.value.email}
                          onInput={(e) => newAdmin.value.email = e.target.value}
                          type="email"
                          class="form-control"
                          required
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Password</label>
                        <input
                          value={newAdmin.value.password}
                          onInput={(e) => newAdmin.value.password = e.target.value}
                          type="password"
                          class="form-control"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" onClick={() => showCreateModal.value = false}>Cancel</button>
                      <button type="submit" class="btn btn-primary">Create</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};
