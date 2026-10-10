import { api } from './client';

export type AppNotification = { id: number; type: string; title: string; body: string; data: string | Record<string, any> | null; created_at: string; read_at: string | null };
export type NotificationsPage = { unread_count: number; items: AppNotification[] };

export const fetchNotifications = () => api<NotificationsPage>('/notifications?limit=50', { auth: true });
export const fetchUnreadCount = () => api<{ unread_count: number }>('/notifications/unread-count', { auth: true });
export const markRead = (id: number) => api(`/notifications/${id}/read`, { method: 'POST', auth: true });
export const markAllRead = () => api('/notifications/read-all', { method: 'POST', auth: true });
