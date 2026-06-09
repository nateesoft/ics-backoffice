import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/ics-backoffice/api',
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
  getAll: (issueId: number) => api.get(`/issues/${issueId}/attachments`),
  upload: (issueId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/issues/${issueId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (issueId: number, id: number) => api.delete(`/issues/${issueId}/attachments/${id}`),
};

export const notesApi = {
  getAll: () => api.get('/notes'),
  create: (data: { content?: string; color?: string }) => api.post('/notes', data),
  update: (id: number, data: { content?: string; color?: string }) => api.put(`/notes/${id}`, data),
  remove: (id: number) => api.delete(`/notes/${id}`),
  reorder: (ids: number[]) => api.patch('/notes/reorder', { ids }),
};

export const commentsApi = {
  getAll: (issueId: number) => api.get(`/issues/${issueId}/comments`),
  create: (issueId: number, content: string) => api.post(`/issues/${issueId}/comments`, { content }),
  update: (issueId: number, id: number, content: string) => api.put(`/issues/${issueId}/comments/${id}`, { content }),
  remove: (issueId: number, id: number) => api.delete(`/issues/${issueId}/comments/${id}`),
};

export const commentAttachmentsApi = {
  upload: (commentId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/comments/${commentId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (commentId: number, id: number) => api.delete(`/comments/${commentId}/attachments/${id}`),
};

export const documentsApi = {
  getAll: () => api.get('/documents'),
  getOne: (id: number) => api.get(`/documents/${id}`),
  create: (data: { title: string; category: string; content?: string }) =>
    api.post('/documents', data),
  update: (id: number, data: { title?: string; category?: string; content?: string }) =>
    api.put(`/documents/${id}`, data),
  remove: (id: number) => api.delete(`/documents/${id}`),
  uploadAttachment: (documentId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/documents/${documentId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeAttachment: (documentId: number, id: number) =>
    api.delete(`/documents/${documentId}/attachments/${id}`),
  downloadUrl: (documentId: number, id: number) =>
    `${api.defaults.baseURL}/documents/${documentId}/attachments/${id}/download`,
};

export default api;
