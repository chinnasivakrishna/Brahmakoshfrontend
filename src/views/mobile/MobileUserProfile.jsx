import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';

export default {
  name: 'MobileUserProfile',
  setup() {
    const { user, fetchCurrentUser } = useAuth();
    const loading = ref(false);
    const error = ref('');

    onMounted(async () => {
      loading.value = true;
      error.value = '';
      try {
        await fetchCurrentUser('user');
      } catch (e) {
        console.error('[MobileUserProfile] Failed to load user profile:', e);
        error.value = e.message || 'Failed to load profile';
      } finally {
        loading.value = false;
      }
    });

    const getProfileImageUrl = () => {
      if (!user.value) return null;
      // Prefer presigned URL if present
      return user.value.profileImageUrl || user.value.profileImage || null;
    };

    return () => {
      const imageUrl = getProfileImageUrl();

      return (
        <div class="card">
          <div class="card-body">
            <h1 class="card-title mb-4">My Profile</h1>

            {loading.value && <p>Loading profile...</p>}
            {error.value && <div class="alert alert-danger">{error.value}</div>}

            {!loading.value && !error.value && user.value && (
              <div>
                {imageUrl && (
                  <div class="mb-4" style={{ textAlign: 'center' }}>
                    <img
                      src={imageUrl}
                      alt="Profile"
                      style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #007bff',
                        marginBottom: '10px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                )}
                
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>Basic Information</h3>
                  <div class="mb-3">
                    <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Email:</strong>
                    <span style={{ color: '#333' }}>{user.value.email}</span>
                    {user.value.emailVerified && (
                      <span style={{ 
                        marginLeft: '10px', 
                        color: '#28a745', 
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>✓ Verified</span>
                    )}
                  </div>
                  {user.value.mobile && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Mobile:</strong>
                      <span style={{ color: '#333' }}>{user.value.mobile}</span>
                      {user.value.mobileVerified && (
                        <span style={{ 
                          marginLeft: '10px', 
                          color: '#28a745', 
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>✓ Verified</span>
                      )}
                    </div>
                  )}
                  {user.value.profile && user.value.profile.name && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Full Name:</strong>
                      <span style={{ color: '#333' }}>{user.value.profile.name}</span>
                    </div>
                  )}
                  {user.value.name && !user.value.profile?.name && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Name:</strong>
                      <span style={{ color: '#333' }}>{user.value.name}</span>
                    </div>
                  )}
                </div>

                {user.value.profile && (
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>Profile Details</h3>
                    {user.value.profile.dob && (
                      <div class="mb-3">
                        <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Date of Birth:</strong>
                        <span style={{ color: '#333' }}>
                          {new Date(user.value.profile.dob).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    {user.value.profile.timeOfBirth && (
                      <div class="mb-3">
                        <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Time of Birth:</strong>
                        <span style={{ color: '#333' }}>{user.value.profile.timeOfBirth}</span>
                      </div>
                    )}
                    {user.value.profile.placeOfBirth && (
                      <div class="mb-3">
                        <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Place of Birth:</strong>
                        <span style={{ color: '#333' }}>{user.value.profile.placeOfBirth}</span>
                      </div>
                    )}
                    {user.value.profile.gowthra && (
                      <div class="mb-3">
                        <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Gowthra:</strong>
                        <span style={{ color: '#333' }}>{user.value.profile.gowthra}</span>
                      </div>
                    )}
                    {user.value.profile.profession && (
                      <div class="mb-3">
                        <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Profession:</strong>
                        <span style={{ 
                          color: '#333',
                          textTransform: 'capitalize'
                        }}>{user.value.profile.profession.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>Account Information</h3>
                  <div class="mb-3">
                    <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Role:</strong>
                    <span style={{ 
                      color: '#333',
                      textTransform: 'capitalize'
                    }}>{user.value.role || 'user'}</span>
                  </div>
                  {user.value.registrationStep !== undefined && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Registration Status:</strong>
                      <span style={{ color: '#333' }}>
                        {user.value.registrationStep === 3 ? (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Completed</span>
                        ) : user.value.registrationStep === 2 ? (
                          <span style={{ color: '#ffc107' }}>Mobile Verified</span>
                        ) : user.value.registrationStep === 1 ? (
                          <span style={{ color: '#ffc107' }}>Email Verified</span>
                        ) : (
                          <span style={{ color: '#dc3545' }}>Incomplete</span>
                        )}
                      </span>
                    </div>
                  )}
                  {user.value.isActive !== undefined && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Account Status:</strong>
                      <span style={{ 
                        color: user.value.isActive ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {user.value.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  )}
                  {user.value.clientId && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Associated Client:</strong>
                      <span style={{ color: '#333' }}>
                        {typeof user.value.clientId === 'object' && user.value.clientId.businessName 
                          ? user.value.clientId.businessName 
                          : user.value.clientId.email || 'N/A'}
                      </span>
                    </div>
                  )}
                  {user.value.createdAt && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Member Since:</strong>
                      <span style={{ color: '#333' }}>
                        {new Date(user.value.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  {user.value.authMethod && (
                    <div class="mb-3">
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Authentication Method:</strong>
                      <span style={{ 
                        color: '#333',
                        textTransform: 'capitalize'
                      }}>{user.value.authMethod}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };
  }
};


