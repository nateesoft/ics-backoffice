import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const issuesApi = {
  getAll: () => api.get('/issues'),
  getOne: (id: number) => api.get(`/issues/${id}`),
  getStats: () => api.get('/issues/stats'),
  create: (data: any) => api.post('/issues', data),
  update: (id: number, data: any) => api.put(`/issues/${id}`, data),
  cancel: (id: number) => api.patch(`/issues/${id}/cancel`),
};

export const attachmentsApi = {
  upload: (issueId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/issues/${issueId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (issueId: number, id: number) => api.delete(`/issues/${issueId}/attachments/${id}`),
};

export default api;
