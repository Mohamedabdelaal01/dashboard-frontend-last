import axios from 'axios';

// VITE_API_BASE_URL overrides the default. Defaults to the deployed Railway
// backend so production builds keep working without a .env file.
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://medo-backend-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token + active rep/role into every request
api.interceptors.request.use((config) => {
  try {
    const token = window.localStorage.getItem('gf_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    const rep = window.localStorage.getItem('current_rep');
    if (rep) config.headers['X-Rep'] = rep;
    const role = window.localStorage.getItem('current_rep_role') || 'rep';
    config.headers['X-Rep-Role'] = role;
  } catch (_) { /* ignore */ }
  return config;
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handle 401 by clearing token and redirecting to login
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      if (error.response.status === 401) {
        // Don't redirect on login endpoint itself
        if (!error.config?.url?.includes('/api/auth/')) {
          localStorage.removeItem('gf_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard APIs
// ═══════════════════════════════════════════════════════════════════════════

export const fetchDashboard = async () => {
  const response = await api.get('/api/dashboard');
  return response.data;
};

export const fetchLeads = async (params = {}) => {
  const response = await api.get('/api/leads', { params });
  return response.data;
};

export const fetchLeadDetail = async (userId) => {
  const response = await api.get(`/api/leads/${userId}`);
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Intelligence APIs (additive — new endpoints introduced by the merge)
// ═══════════════════════════════════════════════════════════════════════════

export const fetchPredictions = async () => {
  const response = await api.get('/api/predictions');
  return response.data;
};

export const triggerMessage = async ({ user_id, action_type, force } = {}) => {
  const response = await api.post('/api/trigger-message', { user_id, action_type, force });
  return response.data;
};

export const fetchFollowUpState = async (userId) => {
  const response = await api.get(`/api/follow-up-state/${userId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// O2O Attribution APIs
// ═══════════════════════════════════════════════════════════════════════════

/** Receptionist confirms a physical showroom visit via visit_code. */
export const confirmVisit = async (visitCode) => {
  const response = await api.post('/api/visits/confirm', { visit_code: visitCode });
  return response.data;
};

/** Sales rep records an offline purchase for a lead. */
export const recordPurchase = async ({ user_id, product_id, price, branch, notes } = {}) => {
  const response = await api.post('/api/purchases', { user_id, product_id, price, branch, notes });
  return response.data;
};

/** Fetch purchase history for a single lead. */
export const fetchLeadPurchases = async (userId) => {
  const response = await api.get(`/api/leads/${userId}/purchases`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

export const formatLeadClass = (leadClass) => {
  const map = {
    cold:      'بارد',
    warm:      'دافئ',
    hot:       'ساخن',
    visited:   'زار المعرض',
    purchased: 'اشترى',
    converted: 'تم التحويل', // legacy
  };
  return map[leadClass] || leadClass;
};

export const getLeadBadgeClass = (leadClass) => {
  const map = {
    cold:      'badge-cold',
    warm:      'badge-warm',
    hot:       'badge-hot',
    visited:   'badge-visited',
    purchased: 'badge-purchased',
    converted: 'badge-converted', // legacy
  };
  return map[leadClass] || 'badge-cold';
};

// ── Branch cache (populated once from /api/branches) ─────────────────────────
const _BRANCH_FALLBACK = {
  nasr_city:  'نصر سيتي',
  maadi:      'المعادي',
  new_cairo:  'القاهرة الجديدة',
  october:    'أكتوبر',
  alexandria: 'الإسكندرية',
  helwan:     'حلوان',
  faisal:     'فيصل',
  ain_shams:  'عين شمس',
};
let _branchCache = null; // {id → name} after first load

export const fetchBranches = async () => {
  const res = await api.get('/api/branches');
  const list = res.data.branches || [];
  _branchCache = Object.fromEntries(list.map(b => [b.id, b.name]));
  return list; // [{id, name}]
};

export const updateBranches = async (branches) => {
  const res = await api.put('/api/branches', { branches });
  const list = res.data.branches || [];
  _branchCache = Object.fromEntries(list.map(b => [b.id, b.name]));
  return list;
};

export const formatBranch = (branch) => {
  if (!branch) return '';
  if (_branchCache && _branchCache[branch] !== undefined) return _branchCache[branch];
  return _BRANCH_FALLBACK[branch] || branch;
};

// ✅ FIX: added missing map_click
export const formatEventType = (eventType) => {
  const map = {
    entry_offer: 'دخول العرض',
    entry_catalog: 'دخول الكتالوج',
    entry_location: 'دخول الفروع',
    product_details: 'تفاصيل المنتج',
    location_request: 'طلب الموقع',
    contact_request: 'طلب تواصل',
    branch_selected: 'اختيار فرع',
    map_click: 'نقر على الخريطة', // ✅ الجديد
    visit_confirmed: 'تأكيد الزيارة',
  };
  return map[eventType] || eventType;
};

// ═══════════════════════════════════════════════════════════════════════════
// Auth APIs
// ═══════════════════════════════════════════════════════════════════════════

export const loginUser = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

export const fetchMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Analytics APIs
// ═══════════════════════════════════════════════════════════════════════════

export const fetchAnalytics = async (params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const response = await api.get('/api/analytics', { params: filtered });
  return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Settings & Users APIs (admin only)
// ═══════════════════════════════════════════════════════════════════════════

export const fetchSettings = async () => {
  const response = await api.get('/api/settings');
  return response.data;
};

export const updateSetting = async (key, value) => {
  const response = await api.put(`/api/settings/${key}`, { value });
  return response.data;
};

export const fetchUsers = async () => {
  const response = await api.get('/api/users');
  return response.data;
};

/** fetchReps — returns string[] of sales rep names. Accessible to all auth users. */
export const fetchReps = async () => {
  const response = await api.get('/api/reps');
  return response.data.reps; // string[]
};

export const createUser = async (data) => {
  const response = await api.post('/api/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/api/users/${id}`, data);
  return response.data;
};

export default api;
