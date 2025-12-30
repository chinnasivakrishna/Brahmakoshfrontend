import { RouterView } from 'vue-router';
import Header from '../components/Header.jsx';

export default {
  name: 'DashboardLayout',
  setup() {
    return () => (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <main style={{ padding: '2rem', minHeight: 'calc(100vh - 70px)' }}>
          <RouterView />
        </main>
      </div>
    );
  }
};
