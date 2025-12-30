import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.jsx'
import router from './router/index.js'
import { useAuth } from './store/auth.js'

const app = createApp(App)
app.use(router)

// Initialize auth on app start (non-blocking)
const { initializeAuth } = useAuth()
initializeAuth().catch(err => {
  console.error('Failed to initialize auth:', err)
})

app.mount('#app')
