import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, type Notification } from '@/services/notification.service';
import { toast } from "sonner";

export type { Notification };

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [data, count] = await Promise.all([
        notificationService.getNotifications(user.id),
        notificationService.getUnreadCount(user.id)
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();

      // Initialize real-time subscription for notifications (optional for V1)
      // For now, we'll just fetch once on mount and provide refresh methods
    }
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh: fetchNotifications,
    markNotificationAsRead: async (notificationId: string) => {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    },
    markAllNotificationsAsRead: async () => {
      if (!user?.id) return;
      const success = await notificationService.markAllAsRead(user.id);
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    },
    removeNotification: async (notificationId: string) => {
      const success = await notificationService.deleteNotification(notificationId);
      if (success) {
        const removed = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (removed && !removed.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    },
    sendNotification: async (
      userId: string,
      title: string,
      message: string,
      type: 'info' | 'success' | 'warning' | 'error'
    ) => {
      const result = await notificationService.createNotification({
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      });
      if (result) {
        if (userId === user?.id) {
          setNotifications(prev => [result, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
      return result;
    },
    sendNotificationToAll: async (
      title: string,
      message: string,
      type: 'info' | 'success' | 'warning' | 'error'
    ) => {
      // This would typically be a server-side or admin function
      console.log('sendNotificationToAll called - implementation usually server-side');
    },
  };
}