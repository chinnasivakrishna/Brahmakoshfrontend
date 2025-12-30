export default {
  name: 'ClientServices',
  setup() {
    return () => (
      <div class="card">
        <div class="card-body">
          <h1 class="card-title mb-4">Services</h1>
          <div class="row g-3">
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body text-center">
                  <h3 class="card-title">Astro</h3>
                  <p class="card-text text-muted">Astrology services</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body text-center">
                  <h3 class="card-title">Healing</h3>
                  <p class="card-text text-muted">Healing services</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body text-center">
                  <h3 class="card-title">Yoga</h3>
                  <p class="card-text text-muted">Yoga services</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card bg-light">
                <div class="card-body text-center">
                  <h3 class="card-title">Brahma Bazar</h3>
                  <p class="card-text text-muted">Brahma Bazar services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
