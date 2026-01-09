import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'MobileUserRegister',
  setup() {
    const router = useRouter();
    
    // Step tracking
    const step = ref(1);
    const email = ref('');
    const password = ref('');
    const emailOtp = ref('');
    const emailOtpSent = ref(false);
    
    // Step 2: Mobile OTP
    const mobile = ref('');
    const mobileOtp = ref('');
    const mobileOtpSent = ref(false);
    const otpMethod = ref('twilio'); // 'twilio', 'gupshup', or 'whatsapp'
    
    // Step 3: Profile
    const profile = ref({
      name: '',
      dob: '',
      timeOfBirth: '',
      placeOfBirth: '',
      latitude: '',
      longitude: '',
      gowthra: ''
    });
    const imageFile = ref(null);
    const userToken = ref(null);
    
    const loading = ref(false);
    const error = ref('');
    const googleInitialized = ref(false);

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
          alert('Email verified successfully! Now enter your mobile number.');
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
        const response = await api.request('/mobile/user/register/step2', {
          method: 'POST',
          body: { 
            email: email.value, 
            mobile: mobile.value,
            otpMethod: otpMethod.value
          }
        });
        
        if (response.success) {
          mobileOtpSent.value = true;
          const methodName = otpMethod.value === 'twilio' ? 'Twilio SMS' : 
                            otpMethod.value === 'gupshup' ? 'Gupshup SMS' : 
                            'WhatsApp';
          alert(`OTP sent to your mobile via ${methodName}. Please check and enter the OTP.`);
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
        await api.request('/mobile/user/register/resend-mobile-otp', {
          method: 'POST',
          body: { 
            email: email.value,
            otpMethod: otpMethod.value
          }
        });
        const methodName = otpMethod.value === 'twilio' ? 'Twilio SMS' : 
                          otpMethod.value === 'gupshup' ? 'Gupshup SMS' : 
                          'WhatsApp';
        alert(`OTP resent to your mobile via ${methodName}`);
      } catch (err) {
        error.value = err.message || 'Failed to resend OTP';
      }
    };

    // Get current location
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }

      loading.value = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          profile.value.latitude = position.coords.latitude.toFixed(6);
          profile.value.longitude = position.coords.longitude.toFixed(6);
          loading.value = false;
          alert('Location captured successfully!');
        },
        (err) => {
          loading.value = false;
          alert('Unable to retrieve your location: ' + err.message);
        }
      );
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
          null,
          null
        );
        
        if (response.success) {
          userToken.value = response.data?.token || null;
          step.value = 4;
          alert('Profile completed successfully! Now upload your profile image.');
        }
      } catch (err) {
        error.value = err.message || 'Failed to complete registration';
      } finally {
        loading.value = false;
      }
    };

    // Handle image selection
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        imageFile.value = file;
      }
    };

    // Step 4: Upload Profile Image
    const handleStep4 = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';

      try {
        if (!imageFile.value) {
          throw new Error('Please select an image file');
        }
        if (!userToken.value) {
          throw new Error('Missing user token. Please complete profile again.');
        }

        const formData = new FormData();
        formData.append('image', imageFile.value);

        const response = await api.mobileUserRegisterStep4UploadImage(formData, userToken.value);
        if (response.success) {
          alert('Profile image uploaded successfully! You can now login.');
          router.push('/user/login');
        }
      } catch (err) {
        error.value = err.message || 'Failed to upload profile image';
      } finally {
        loading.value = false;
      }
    };

    // Google Sign-In Handler
    const handleGoogleCredential = async (response) => {
      loading.value = true;
      error.value = '';
      
      try {
        console.log('Google Sign-Up response received:', response);
        
        if (!response.credential) {
          throw new Error('No credential received from Google');
        }
        
        const data = await api.request('/auth/user/google', {
          method: 'POST',
          body: {
            idToken: response.credential,
          }
        });
        
        console.log('Google Sign-Up API response:', data);
        
        if (data.data.user.registrationStep === 3) {
          localStorage.setItem('token_user', data.data.token);
          console.log('User fully registered, navigating to dashboard');
          router.push('/mobile/user/dashboard');
        } else {
          console.log('User partially registered, going to step 2');
          email.value = data.data.user.email;
          password.value = 'google_auth_' + Date.now();
          step.value = 2;
          alert('Email verified with Google! Now verify your mobile number.');
        }
      } catch (e) {
        console.error('Google Sign-Up error:', e);
        error.value = e.message || 'Google registration failed';
      } finally {
        loading.value = false;
      }
    };

    // Initialize Google Sign-In
    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        console.error('Google Sign-In API not available');
        error.value = 'Google Sign-In is temporarily unavailable';
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: '449350149768-a1a1qn8siakh4hq7tejj60ri81c6hh85.apps.googleusercontent.com',
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signup'
        });

        const buttonDiv = document.getElementById('g_id_signin');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: 340,
            type: 'standard',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
          googleInitialized.value = true;
          console.log('Google Sign-In button rendered successfully');
        } else {
          console.error('Google Sign-In button container not found');
        }
      } catch (err) {
        console.error('Google Sign-In initialization error:', err);
        error.value = 'Failed to initialize Google Sign-In';
      }
    };

    // Load Google Script
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        console.log('Google Sign-In already loaded');
        initGoogle();
        return;
      }

      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        console.log('Google Sign-In script already in DOM, waiting for load');
        existingScript.addEventListener('load', initGoogle);
        return;
      }

      console.log('Loading Google Sign-In script');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Sign-In script loaded');
        initGoogle();
      };
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        error.value = 'Google Sign-In is temporarily unavailable';
      };
      document.head.appendChild(script);
    };

    onMounted(() => {
      console.log('MobileUserRegister component mounted');
      loadGoogleScript();
    });

    onUnmounted(() => {
      if (window.google?.accounts?.id && googleInitialized.value) {
        try {
          window.google.accounts.id.cancel();
        } catch (e) {
          console.error('Error canceling Google Sign-In:', e);
        }
      }
    });

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f5f5f5' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '650px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
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
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: step.value >= 4 ? '#3498db' : '#e0e0e0', color: step.value >= 4 ? 'white' : '#666', borderRadius: '8px', margin: '0 5px' }}>
              Step 4: Image
            </div>
          </div>

          {error.value && (
            <div class="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fee', border: '1px solid #fcc', borderRadius: '6px', color: '#c33' }}>
              {error.value}
            </div>
          )}

          {/* Step 1: Email OTP */}
          {step.value === 1 && (
            <>
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

              {/* Google Sign-In */}
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280', position: 'relative' }}>
                  <span style={{ background: 'white', padding: '0 10px', position: 'relative', zIndex: 1 }}>or</span>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e5e7eb', zIndex: 0 }}></div>
                </div>
                <div id="g_id_signin" style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }}></div>
              </div>
            </>
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
              
              {!mobileOtpSent.value && (
                <div class="mb-3">
                  <label class="form-label">OTP Method</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px', border: '2px solid', borderColor: otpMethod.value === 'twilio' ? '#3498db' : '#e0e0e0', borderRadius: '8px', background: otpMethod.value === 'twilio' ? '#f0f8ff' : 'white', transition: 'all 0.2s' }}>
                      <input
                        type="radio"
                        value="twilio"
                        checked={otpMethod.value === 'twilio'}
                        onChange={(e) => otpMethod.value = e.target.value}
                        style={{ marginRight: '0.75rem', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>Twilio SMS</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Receive OTP via Twilio SMS service</div>
                      </div>
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px', border: '2px solid', borderColor: otpMethod.value === 'gupshup' ? '#3498db' : '#e0e0e0', borderRadius: '8px', background: otpMethod.value === 'gupshup' ? '#f0f8ff' : 'white', transition: 'all 0.2s' }}>
                      <input
                        type="radio"
                        value="gupshup"
                        checked={otpMethod.value === 'gupshup'}
                        onChange={(e) => otpMethod.value = e.target.value}
                        style={{ marginRight: '0.75rem', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>Gupshup SMS</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Receive OTP via Gupshup SMS service</div>
                      </div>
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px', border: '2px solid', borderColor: otpMethod.value === 'whatsapp' ? '#3498db' : '#e0e0e0', borderRadius: '8px', background: otpMethod.value === 'whatsapp' ? '#f0f8ff' : 'white', transition: 'all 0.2s' }}>
                      <input
                        type="radio"
                        value="whatsapp"
                        checked={otpMethod.value === 'whatsapp'}
                        onChange={(e) => otpMethod.value = e.target.value}
                        style={{ marginRight: '0.75rem', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>WhatsApp</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Receive OTP via WhatsApp message</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
              
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
              
              {/* Location Fields */}
              <div class="mb-3">
                <label class="form-label">Location (Latitude & Longitude)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    value={profile.value.latitude}
                    onInput={(e) => profile.value.latitude = e.target.value}
                    type="number"
                    step="any"
                    class="form-control"
                    placeholder="Latitude"
                  />
                  <input
                    value={profile.value.longitude}
                    onInput={(e) => profile.value.longitude = e.target.value}
                    type="number"
                    step="any"
                    class="form-control"
                    placeholder="Longitude"
                  />
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  class="btn btn-secondary btn-sm"
                  disabled={loading.value}
                >
                  {loading.value ? 'Getting Location...' : 'Get Current Location'}
                </button>
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
              <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                {loading.value ? 'Completing Registration...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* Step 4: Profile Image Upload */}
          {step.value === 4 && (
            <form onSubmit={handleStep4}>
              <div class="mb-3">
                <label class="form-label">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  class="form-control"
                  required
                />
              </div>
              <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
                {loading.value ? 'Uploading...' : 'Upload Image'}
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