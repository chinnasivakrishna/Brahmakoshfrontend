import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'MobileUserRegister',
  setup() {
    const router = useRouter();
    
    // Step 1: Email OTP
    const step = ref(1);
    const email = ref('');
    const password = ref('');
    const emailOtp = ref('');
    const emailOtpSent = ref(false);
    
    // Step 2: Mobile OTP
    const mobile = ref('');
    const mobileOtp = ref('');
    const mobileOtpSent = ref(false);
    
    // Step 3: Profile
    const profile = ref({
      name: '',
      dob: '',
      timeOfBirth: '',
      placeOfBirth: '',
      gowthra: ''
    });
    const imageFile = ref(null);
    const imageFileName = ref('');
    const imageContentType = ref('');
    
    const loading = ref(false);
    const error = ref('');

    // Step 1: Send Email OTP
    const handleStep1 = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.mobileUserRegisterStep1(email.value, password.value);
        if (response.success) {
          emailOtpSent.value = true;
          alert('OTP sent to your email. Please check and enter the OTP.');
        }
      } catch (err) {
        error.value = err.message || 'Failed to send OTP';
      } finally {
        loading.value = false;
      }
    };

    // Step 1: Verify Email OTP
    const handleStep1Verify = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.mobileUserRegisterStep1Verify(email.value, emailOtp.value);
        if (response.success) {
          step.value = 2;
          alert('Email verified successfully! Now verify your mobile number.');
        }
      } catch (err) {
        error.value = err.message || 'Invalid OTP';
      } finally {
        loading.value = false;
      }
    };

    // Resend Email OTP
    const resendEmailOTP = async () => {
      try {
        await api.resendEmailOTP(email.value);
        alert('OTP resent to your email');
      } catch (err) {
        error.value = err.message || 'Failed to resend OTP';
      }
    };

    // Step 2: Send Mobile OTP
    const handleStep2 = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.mobileUserRegisterStep2(email.value, mobile.value);
        if (response.success) {
          mobileOtpSent.value = true;
          alert('OTP sent to your mobile number. Please check and enter the OTP.');
        }
      } catch (err) {
        error.value = err.message || 'Failed to send mobile OTP';
      } finally {
        loading.value = false;
      }
    };

    // Step 2: Verify Mobile OTP
    const handleStep2Verify = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.mobileUserRegisterStep2Verify(email.value, mobileOtp.value);
        if (response.success) {
          step.value = 3;
          alert('Mobile verified successfully! Now complete your profile.');
        }
      } catch (err) {
        error.value = err.message || 'Invalid OTP';
      } finally {
        loading.value = false;
      }
    };

    // Resend Mobile OTP
    const resendMobileOTP = async () => {
      try {
        await api.resendMobileOTP(email.value);
        alert('OTP resent to your mobile number');
      } catch (err) {
        error.value = err.message || 'Failed to resend OTP';
      }
    };

    // Step 3: Complete Profile
    const handleStep3 = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.mobileUserRegisterStep3(
          email.value,
          profile.value,
          imageFileName.value,
          imageContentType.value
        );
        
        if (response.success) {
          alert('Registration completed successfully! You can now login immediately.');
          // Redirect to login page
          router.push('/user/login');
        }
      } catch (err) {
        error.value = err.message || 'Failed to complete registration';
      } finally {
        loading.value = false;
      }
    };

    // Handle image upload
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        imageFile.value = file;
        imageFileName.value = file.name;
        imageContentType.value = file.type;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f5f5f5' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>
            Mobile User Registration
          </h1>
          
          {/* Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: step.value >= 1 ? '#3498db' : '#e0e0e0', color: step.value >= 1 ? 'white' : '#666', borderRadius: '8px', margin: '0 5px' }}>
              Step 1: Email
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: step.value >= 2 ? '#3498db' : '#e0e0e0', color: step.value >= 2 ? 'white' : '#666', borderRadius: '8px', margin: '0 5px' }}>
              Step 2: Mobile
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: step.value >= 3 ? '#3498db' : '#e0e0e0', color: step.value >= 3 ? 'white' : '#666', borderRadius: '8px', margin: '0 5px' }}>
              Step 3: Profile
            </div>
          </div>

          {error.value && (
            <div class="alert alert-danger" style={{ marginBottom: '1rem' }}>
              {error.value}
            </div>
          )}

          {/* Step 1: Email OTP */}
          {step.value === 1 && (
            <form onSubmit={emailOtpSent.value ? handleStep1Verify : handleStep1}>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input
                  value={email.value}
                  onInput={(e) => email.value = e.target.value}
                  type="email"
                  class="form-control"
                  required
                  disabled={emailOtpSent.value}
                  placeholder="Enter email"
                />
              </div>
              {!emailOtpSent.value && (
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input
                    value={password.value}
                    onInput={(e) => password.value = e.target.value}
                    type="password"
                    class="form-control"
                    required
                    placeholder="Enter password"
                  />
                </div>
              )}
              {emailOtpSent.value && (
                <>
                  <div class="mb-3">
                    <label class="form-label">Enter OTP</label>
                    <input
                      value={emailOtp.value}
                      onInput={(e) => emailOtp.value = e.target.value}
                      type="text"
                      class="form-control"
                      required
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={resendEmailOTP}
                    class="btn btn-link"
                    style={{ padding: 0, marginBottom: '1rem' }}
                  >
                    Resend OTP
                  </button>
                </>
              )}
              <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                {loading.value 
                  ? 'Processing...' 
                  : emailOtpSent.value 
                  ? 'Verify Email OTP' 
                  : 'Send Email OTP'}
              </button>
            </form>
          )}

          {/* Step 2: Mobile OTP */}
          {step.value === 2 && (
            <form onSubmit={mobileOtpSent.value ? handleStep2Verify : handleStep2}>
              <div class="mb-3">
                <label class="form-label">Mobile Number</label>
                <input
                  value={mobile.value}
                  onInput={(e) => mobile.value = e.target.value}
                  type="tel"
                  class="form-control"
                  required
                  disabled={mobileOtpSent.value}
                  placeholder="Enter mobile number with country code (e.g., +1234567890)"
                />
              </div>
              {mobileOtpSent.value && (
                <>
                  <div class="mb-3">
                    <label class="form-label">Enter OTP</label>
                    <input
                      value={mobileOtp.value}
                      onInput={(e) => mobileOtp.value = e.target.value}
                      type="text"
                      class="form-control"
                      required
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={resendMobileOTP}
                    class="btn btn-link"
                    style={{ padding: 0, marginBottom: '1rem' }}
                  >
                    Resend OTP
                  </button>
                </>
              )}
              <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                {loading.value 
                  ? 'Processing...' 
                  : mobileOtpSent.value 
                  ? 'Verify Mobile OTP' 
                  : 'Send Mobile OTP'}
              </button>
            </form>
          )}

          {/* Step 3: Profile */}
          {step.value === 3 && (
            <form onSubmit={handleStep3}>
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input
                  value={profile.value.name}
                  onInput={(e) => profile.value.name = e.target.value}
                  type="text"
                  class="form-control"
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Date of Birth</label>
                <input
                  value={profile.value.dob}
                  onInput={(e) => profile.value.dob = e.target.value}
                  type="date"
                  class="form-control"
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Time of Birth</label>
                <input
                  value={profile.value.timeOfBirth}
                  onInput={(e) => profile.value.timeOfBirth = e.target.value}
                  type="time"
                  class="form-control"
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Place of Birth</label>
                <input
                  value={profile.value.placeOfBirth}
                  onInput={(e) => profile.value.placeOfBirth = e.target.value}
                  type="text"
                  class="form-control"
                  placeholder="Enter place of birth"
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Gowthra</label>
                <input
                  value={profile.value.gowthra}
                  onInput={(e) => profile.value.gowthra = e.target.value}
                  type="text"
                  class="form-control"
                  placeholder="Enter gowthra"
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Profile Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  class="form-control"
                />
              </div>
              <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                {loading.value ? 'Completing Registration...' : 'Complete Registration'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
            Already have an account? <RouterLink to="/user/login" style={{ color: '#6366f1', textDecoration: 'none' }}>Login here</RouterLink>
          </p>
        </div>
      </div>
    );
  }
};

