import { ref } from 'vue';

export default {
  name: 'ClientPayments',
  setup() {
    const activeTab = ref('Orders');
    const tabs = ['Orders', 'Credits', 'Subscriptions', 'Tools'];

    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Payments</h1>
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
            {activeTab.value === 'Orders' && <div>Orders content - Coming soon</div>}
            {activeTab.value === 'Credits' && <div>Credits content - Coming soon</div>}
            {activeTab.value === 'Subscriptions' && <div>Subscriptions content - Coming soon</div>}
            {activeTab.value === 'Tools' && <div>Tools content - Coming soon</div>}
          </div>
        </div>
      </div>
    );
  }
};
