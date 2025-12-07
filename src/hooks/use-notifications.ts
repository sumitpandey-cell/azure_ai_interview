// Placeholder hook - backend removed, ready for fresh implementation

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  return {
    notifications: [] as Notification[],
    unreadCount: 0,
    isLoading: false,
    markNotificationAsRead: async (notificationId: string) => { },
    markAllNotificationsAsRead: async () => { },
    removeNotification: async (notificationId: string) => { },
    sendNotification: async (
      userId: string,
      title: string,
      message: string,
      type: 'info' | 'success' | 'warning' | 'error'
    ) => {
      // TODO: Implement with Supabase
      console.log('sendNotification called:', { userId, title, message, type });
    },
    sendNotificationToAll: async (
      title: string,
      message: string,
      type: 'info' | 'success' | 'warning' | 'error'
    ) => {
      // TODO: Implement with Supabase
      console.log('sendNotificationToAll called:', { title, message, type });
    },
  };
}