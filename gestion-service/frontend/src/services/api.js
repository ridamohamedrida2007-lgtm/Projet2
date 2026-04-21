import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  }
};

export const agentService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/agents', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/agents/${id}`);
    return data;
  },
  getStats: async () => {
    const { data } = await api.get('/agents/stats');
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/agents', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/agents/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/agents/${id}`);
    return data;
  }
};

export const planningService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/planning', { params });
    return data;
  },
  getByWeek: async (date) => {
    const { data } = await api.get(`/planning/semaine/${date}`);
    return data;
  },
  getByAgent: async (id, params = {}) => {
    const { data } = await api.get(`/planning/agent/${id}`, { params });
    return data;
  },
  getStats: async (mois, annee) => {
    const { data } = await api.get('/planning/stats', {
      params: { mois, annee }
    });
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/planning', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/planning/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/planning/${id}`);
    return data;
  }
};

export const elementVariableService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/elements-variables', { params });
    return data;
  },
  getByAgent: async (id) => {
    const { data } = await api.get(`/elements-variables/agent/${id}`);
    return data;
  },
  getRecap: async (mois, annee) => {
    const { data } = await api.get(`/elements-variables/recap/${mois}/${annee}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/elements-variables', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/elements-variables/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/elements-variables/${id}`);
    return data;
  },
  valider: async (id) => {
    const { data } = await api.put(`/elements-variables/${id}/valider`);
    return data;
  }
};

export default api;
