import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'AdminClients',
  setup() {
    const clients = ref([]);
    const showCreateModal = ref(false);
    const uploadingLogo = ref(false);
    const newClient = ref({ 
      email: '', 
      password: '',
      confirmPassword: '',
      businessName: '',
      websiteUrl: '',
      gstNumber: '',
      panNumber: '',
      businessLogo: '',
      fullName: '',
      mobileNumber: '',
      address: '',
      city: '',
      pincode: ''
    });

    const fetchClients = async () => {
      try {
        const response = await api.getClients();
        clients.value = response.data.clients;
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };

    const handleLoginAsClient = async (clientId) => {
      try {
        const response = await api.getClientLoginToken(clientId);
        const token = response.data.token;
        
        // Open client dashboard in new tab with token
        const url = `${window.location.origin}/client/overview?token=${token}`;
        window.open(url, '_blank');
      } catch (error) {
        alert(error.message || 'Failed to login as client');
      }
    };

    const handleCreate = async (e) => {
      e.preventDefault();
      try {
        await api.createClient(newClient.value);
        showCreateModal.value = false;
        newClient.value = { 
          email: '', 
          password: '',
          confirmPassword: '',
          businessName: '',
          websiteUrl: '',
          gstNumber: '',
          panNumber: '',
          businessLogo: '',
          fullName: '',
          mobileNumber: '',
          address: '',
          city: '',
          pincode: ''
        };
        fetchClients();
      } catch (error) {
        alert(error.message || 'Failed to create client');
      }
    };

    const handleDelete = async (id) => {
      if (confirm('Are you sure you want to delete this client?')) {
        try {
          await api.deleteClient(id);
          fetchClients();
        } catch (error) {
          alert(error.message || 'Failed to delete client');
        }
      }
    };

    const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          uploadingLogo.value = true;
          
          // Validate file size (10MB)
          if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            uploadingLogo.value = false;
            return;
          }

          // Get presigned URL from backend
          const response = await api.getPresignedUrl(file.name, file.type);
          const { presignedUrl, key } = response.data;

          // Upload file to S3
          await api.uploadToS3(presignedUrl, file);

          // Store the S3 key in the form
          newClient.value.businessLogo = key;
        } catch (error) {
          alert(error.message || 'Failed to upload file');
        } finally {
          uploadingLogo.value = false;
        }
      }
    };

    onMounted(() => {
      fetchClients();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Clients</h1>
            <button onClick={() => showCreateModal.value = true} class="btn btn-primary">Add Client</button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-light">
                <tr>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Business Name</th>
                  <th>Mobile Number</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.value.map(client => (
                  <tr key={client._id}>
                    <td>{client.email}</td>
                    <td>{client.fullName || '-'}</td>
                    <td>{client.businessName || '-'}</td>
                    <td>{client.mobileNumber || '-'}</td>
                    <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span class={`badge ${client.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleLoginAsClient(client._id)} 
                        class="btn btn-primary btn-sm me-2"
                      >
                        Login
                      </button>
                      <button onClick={() => handleDelete(client._id)} class="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showCreateModal.value && (
            <div 
              class="modal show d-block" 
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
              onClick={() => showCreateModal.value = false}
            >
              <div class="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', margin: '1.75rem auto' }}>
                <div class="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                  <div class="modal-header" style={{ flexShrink: 0 }}>
                    <h5 class="modal-title">Add Client</h5>
                    <button type="button" class="btn-close" onClick={() => showCreateModal.value = false}></button>
                  </div>
                  <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div class="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                      <h6 class="mb-3 fw-bold">Business Information</h6>
                      <div class="row">
                        <div class="col-md-12 mb-3">
                          <label class="form-label">Business Name *</label>
                          <input
                            value={newClient.value.businessName}
                            onInput={(e) => newClient.value.businessName = e.target.value}
                            type="text"
                            class="form-control"
                            placeholder="Enter business name"
                          />
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">GST Number</label>
                          <input
                            value={newClient.value.gstNumber}
                            onInput={(e) => newClient.value.gstNumber = e.target.value}
                            type="text"
                            class="form-control"
                            placeholder="Enter GST number"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">PAN Number</label>
                          <input
                            value={newClient.value.panNumber}
                            onInput={(e) => newClient.value.panNumber = e.target.value}
                            type="text"
                            class="form-control"
                            placeholder="Enter PAN number"
                          />
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-12 mb-3">
                          <label class="form-label">Website URL</label>
                          <input
                            value={newClient.value.websiteUrl}
                            onInput={(e) => newClient.value.websiteUrl = e.target.value}
                            type="url"
                            class="form-control"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-12 mb-3">
                          <label class="form-label">Business Logo</label>
                          <input
                            onChange={handleFileChange}
                            type="file"
                            class="form-control"
                            accept="image/png,image/jpg,image/jpeg,image/gif"
                            disabled={uploadingLogo.value}
                          />
                          <small class="form-text text-muted">
                            {uploadingLogo.value ? 'Uploading...' : 'Upload your business logo (PNG, JPG, GIF up to 10MB)'}
                          </small>
                          {newClient.value.businessLogo && !uploadingLogo.value && (
                            <div class="text-success mt-1">✓ Logo uploaded successfully</div>
                          )}
                        </div>
                      </div>

                      <hr class="my-4" />
                      
                      <h6 class="mb-3 fw-bold">Personal Information</h6>
                      <div class="row">
                        <div class="col-md-12 mb-3">
                          <label class="form-label">Full Name *</label>
                          <input
                            value={newClient.value.fullName}
                            onInput={(e) => newClient.value.fullName = e.target.value}
                            type="text"
                            class="form-control"
                            placeholder="Enter full name"
                          />
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Email Address *</label>
                          <input
                            value={newClient.value.email}
                            onInput={(e) => newClient.value.email = e.target.value}
                            type="email"
                            class="form-control"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Mobile Number *</label>
                          <input
                            value={newClient.value.mobileNumber}
                            onInput={(e) => newClient.value.mobileNumber = e.target.value}
                            type="tel"
                            class="form-control"
                            placeholder="Enter mobile number"
                          />
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-12 mb-3">
                          <label class="form-label">Address</label>
                          <textarea
                            value={newClient.value.address}
                            onInput={(e) => newClient.value.address = e.target.value}
                            class="form-control"
                            rows="3"
                            placeholder="Enter address"
                          />
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">City</label>
                          <input
                            value={newClient.value.city}
                            onInput={(e) => newClient.value.city = e.target.value}
                            type="text"
                            class="form-control"
                            placeholder="Enter city"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Pincode</label>
                          <input
                            value={newClient.value.pincode}
                            onInput={(e) => newClient.value.pincode = e.target.value}
                            type="text"
                            class="form-control"
                            placeholder="Enter pincode"
                          />
                        </div>
                      </div>

                      <hr class="my-4" />
                      
                      <h6 class="mb-3 fw-bold">Account Security</h6>
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Password *</label>
                          <input
                            value={newClient.value.password}
                            onInput={(e) => newClient.value.password = e.target.value}
                            type="password"
                            class="form-control"
                            placeholder="Enter password"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Confirm Password *</label>
                          <input
                            value={newClient.value.confirmPassword}
                            onInput={(e) => newClient.value.confirmPassword = e.target.value}
                            type="password"
                            class="form-control"
                            placeholder="Enter confirm password"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer" style={{ flexShrink: 0 }}>
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
