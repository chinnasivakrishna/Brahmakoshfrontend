import { ref } from 'vue';

export default {
  name: 'ClientNotifications',
  setup() {
    const activeTab = ref('Push Notifications');
    const tabs = ['Push Notifications', 'Offers', 'Tickets'];

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Notifications</h1>
          <ul class="nav nav-tabs mb-3">
            {tabs.map(tab => (
              <li key={tab} class="nav-item">
                <button
                  class={`nav-link ${activeTab.value === tab ? 'active' : ''}`}
                  onClick={() => activeTab.value = tab}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
          <div style={{ minHeight: '200px' }}>
            {activeTab.value === 'Push Notifications' && <div>Push notifications - Coming soon</div>}
            {activeTab.value === 'Offers' && <div>Offers - Coming soon</div>}
            {activeTab.value === 'Tickets' && <div>Tickets - Coming soon</div>}
          </div>
        </div>
      </div>
    );
  }
};
