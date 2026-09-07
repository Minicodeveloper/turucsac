import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para añadir el token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Asumiendo que guardas el token aquí
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const layoutService = {
  getLayout: () => api.get('/layout.php').then(res => res.data),
  saveLayout: (layout) => api.post('/layout.php', { layout }).then(res => res.data),
};

export const authService = {
  login: (credentials) => api.post('/auth.php', credentials),
};

export const posService = {
  getPrices: () => api.get('/pos.php?action=prices').then(res => res.data),
  processSale: (data) => api.post('/pos.php?action=sale', data).then(res => res.data),
};

export const inventoryService = {
  getInventory: () => api.get('/inventory.php').then(res => res.data),
  updateItem: (data) => api.post('/inventory.php', data).then(res => res.data),
  getKardex: (combustibleId) => api.get(`/kardex.php?combustible_id=${combustibleId}`).then(res => res.data),
};

export const purchaseService = {
  getAll: () => api.get('/compras.php').then(res => res.data),
  create: (data) => api.post('/compras.php', data).then(res => res.data),
};

export const financeService = {
  getStats: () => api.get('/finanzas.php').then(res => res.data),
  getExpenses: () => api.get('/gastos.php').then(res => res.data),
  addExpense: (data) => api.post('/gastos.php', data).then(res => res.data),
};

export const conciliacionService = {
  getHistory: () => api.get('/conciliacion.php').then(res => res.data),
  processClosing: (data) => api.post('/conciliacion.php', data).then(res => res.data),
};

export const dashboardService = {
  getMetrics: () => api.get('/dashboard.php').then(res => res.data),
};

export const customerService = {
  getAll: () => api.get('/customers.php').then(res => res.data),
  searchByDoc: (doc) => api.get(`/customers.php?documento=${doc}`).then(res => res.data),
  searchQuery: (query) => api.get(`/customers.php?search=${query}`).then(res => res.data),
  create: (data) => api.post('/customers.php', data).then(res => res.data),
  update: (data) => api.put('/customers.php', data).then(res => res.data),
  delete: (id) => api.delete(`/customers.php?id=${id}`).then(res => res.data),
};

export const userService = {
  getUsers: () => api.get('/users.php').then(res => res.data),
  createUser: (data) => api.post('/users.php', data).then(res => res.data),
  deleteUser: (id) => api.delete(`/users.php?id=${id}`).then(res => res.data),
};

export const gymService = {
  getPlanes: () => api.get('/gym_planes.php').then(res => res.data),
  savePlan: (data) => api.post('/gym_planes.php', data).then(res => res.data),
  updatePlan: (data) => api.put('/gym_planes.php', data).then(res => res.data),
  
  getSocios: (search = '') => api.get(`/gym_socios.php?search=${search}`).then(res => res.data),
  createSocio: (data) => api.post('/gym_socios.php', data).then(res => res.data),
  updateSocio: (data) => api.put('/gym_socios.php', data).then(res => res.data),
  deleteSocio: (id) => api.delete(`/gym_socios.php?id=${id}`).then(res => res.data),
  
  // Asistencias
  getAsistencias: () => api.get('/gym_asistencias.php').then(res => res.data),
  recordAsistencia: (data) => api.post('/gym_asistencias.php', data).then(res => res.data),

  // Instructores
  getInstructores: () => api.get('/gym_instructores.php').then(res => res.data),
  createInstructor: (data) => api.post('/gym_instructores.php', data).then(res => res.data),
  updateInstructor: (data) => api.put('/gym_instructores.php', data).then(res => res.data),
  deleteInstructor: (id) => api.delete(`/gym_instructores.php?id=${id}`).then(res => res.data),

  // Ingresos
  getIngresos: (mes) => api.get(`/gym_ingresos.php?mes=${mes}`).then(res => res.data),
  recordPago: (data) => api.post('/gym_ingresos.php', data).then(res => res.data),
};

export default api;
