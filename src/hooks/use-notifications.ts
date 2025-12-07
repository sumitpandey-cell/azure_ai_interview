// Placeholder hook - backend removed, ready for fresh implementation
export function useNotifications() {
  return {
    notifications: [],
    unreadCount: 0,
    loading: false,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    deleteNotification: async () => { },
  };
}