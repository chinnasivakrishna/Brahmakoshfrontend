import { RouterView } from 'vue-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

export default {
  name: 'ClientLayout',
  setup() {
    return () => (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '250px', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
          <Header />
          <main style={{ padding: '2rem', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
            <RouterView />
          </main>
        </div>
      </div>
    );
  }
};
