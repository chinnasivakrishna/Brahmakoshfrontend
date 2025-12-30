import { RouterLink } from 'vue-router';

export default {
  name: 'NotFound',
  setup() {
    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
        <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
        <RouterLink to="/dashboard" class="btn btn-primary">Go to Dashboard</RouterLink>
      </div>
    );
  }
};
