import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/ics-backoffice/api',
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      if (err?.config?.url?.includes('/auth/login')) {
        return Promise.reject(err);
      }
      window.dispatchEvent(new Event('auth:unauthorized'));
      return new Promise(() => {}); // swallow — ป้องกัน error ไปถึง Next.js overlay
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  heartbeat: () => api.post('/auth/heartbeat'),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/auth/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeAvatar: () => api.delete('/auth/avatar'),
};

export function avatarSrc(userId: number): string {
  return `${api.defaults.baseURL}/auth/avatar/${userId}`;
}

export interface OnlineUser {
  id: number;
  username: string;
  role: string;
  isOnline: boolean;
  avatarFilename: string | null;
}

export const usersApi = {
  getAll: () => api.get<OnlineUser[]>('/auth/users'),
};

export const issuesApi = {
  getAll: () => api.get('/issues'),
  getOne: (id: number) => api.get(`/issues/${id}`),
  getStats: () => api.get('/issues/stats'),
  create: (data: any) => api.post('/issues', data),
  update: (id: number, data: any) => api.put(`/issues/${id}`, data),
  cancel: (id: number) => api.patch(`/issues/${id}/cancel`),
  restore: (id: number) => api.patch(`/issues/${id}/restore`),
  getHistory: (id: number) => api.get(`/issues/${id}/history`),
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
  create: (issueId: number, content: string, parentId?: number) =>
    api.post(`/issues/${issueId}/comments`, parentId ? { content, parentId } : { content }),
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

export const commentReactionsApi = {
  toggle: (commentId: number, emoji: string) =>
    api.post(`/comments/${commentId}/reactions`, { emoji }),
};

export const documentsApi = {
  getAll: () => api.get('/documents'),
  getOne: (id: number) => api.get(`/documents/${id}`),
  create: (data: { title: string; category: string; content?: string; docType?: string; folderId?: number | null }) =>
    api.post('/documents', data),
  update: (id: number, data: { title?: string; category?: string; content?: string; docType?: string; folderId?: number | null }) =>
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

export const docCommentsApi = {
  getAll: (documentId: number) =>
    api.get(`/documents/${documentId}/comments`),
  create: (documentId: number, content: string, parentId?: number) =>
    api.post(`/documents/${documentId}/comments`, { content, parentId }),
  update: (id: number, content: string) =>
    api.put(`/document-comments/${id}`, { content }),
  remove: (id: number) =>
    api.delete(`/document-comments/${id}`),
  toggleReaction: (commentId: number, emoji: string) =>
    api.post(`/document-comments/${commentId}/reactions`, { emoji }),
};

export const uploadsApi = {
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ filename: string }>('/doc-images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  imageUrl: (filename: string) =>
    `${api.defaults.baseURL}/doc-images/${filename}`,
};

export interface DocFolder {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export const docFoldersApi = {
  getAll: () => api.get<DocFolder[]>('/document-folders'),
  create: (name: string) => api.post<DocFolder>('/document-folders', { name }),
  rename: (id: number, name: string) => api.patch<DocFolder>(`/document-folders/${id}`, { name }),
  remove: (id: number) => api.delete(`/document-folders/${id}`),
};

export interface AppNotification {
  id: number;
  senderUsername: string;
  issueId: number;
  commentId: number;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getUnread: () => api.get<AppNotification[]>('/notifications'),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
};

export interface ChatMessage {
  id: number;
  senderId: number;
  senderUsername: string;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const chatApi = {
  getConversation: (otherUserId: number) =>
    api.get<ChatMessage[]>(`/chat/conversation/${otherUserId}`),
  getUnread: () =>
    api.get<Record<number, number>>('/chat/unread'),
};

export const pushApi = {
  subscribe: (subscription: { endpoint: string; p256dh: string; auth: string }) =>
    api.post('/push-subscriptions/subscribe', subscription),
  unsubscribe: (endpoint: string) =>
    api.delete('/push-subscriptions/unsubscribe', { data: { endpoint } }),
};

export interface ProjectPhase {
  id: number;
  projectId: number;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  createdAt: string;
}

export interface ProjectPlan {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  color: string;
  createdAt: string;
  phases: ProjectPhase[];
}

export const projectPlansApi = {
  getAll: () => api.get<ProjectPlan[]>('/project-plans'),
  create: (data: { name: string; description?: string; startDate: string; endDate: string; color: string }) =>
    api.post<ProjectPlan>('/project-plans', data),
  update: (id: number, data: Partial<{ name: string; description: string; startDate: string; endDate: string; color: string }>) =>
    api.put<ProjectPlan>(`/project-plans/${id}`, data),
  remove: (id: number) => api.delete(`/project-plans/${id}`),
  addPhase: (projectId: number, data: { name: string; startDate: string; endDate: string; color?: string }) =>
    api.post<ProjectPhase>(`/project-plans/${projectId}/phases`, data),
  updatePhase: (projectId: number, phaseId: number, data: Partial<{ name: string; startDate: string; endDate: string; color: string }>) =>
    api.put<ProjectPhase>(`/project-plans/${projectId}/phases/${phaseId}`, data),
  removePhase: (projectId: number, phaseId: number) =>
    api.delete(`/project-plans/${projectId}/phases/${phaseId}`),
};

export const lineNotifyApi = {
  getStatus: () => api.get<{ linked: boolean; expiresAt: string | null }>('/line-notify/status'),
  generateToken: () => api.post<{ token: string; expiresAt: string }>('/line-notify/generate-token'),
  unlink: () => api.delete('/line-notify/unlink'),
};

export default api;
