import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(n => !n.is_read).length;
        set({ notifications, unreadCount });
      },

      addNotification: (notification) => {
        const { notifications } = get();
        const newNotifications = [notification, ...notifications];
        const unreadCount = newNotifications.filter(n => !n.is_read).length;
        set({ notifications: newNotifications, unreadCount });
      },

      markAsRead: (notificationId) => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        set({ notifications: updatedNotifications, unreadCount });
      },

      markAllAsRead: () => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
        set({ notifications: updatedNotifications, unreadCount: 0 });
      },

      deleteNotification: (notificationId) => {
        const { notifications } = get();
        const filteredNotifications = notifications.filter(n => n.id !== notificationId);
        const unreadCount = filteredNotifications.filter(n => !n.is_read).length;
        set({ notifications: filteredNotifications, unreadCount });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);