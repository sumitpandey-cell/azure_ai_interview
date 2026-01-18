import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Notification = Tables<"notifications">;
export type NotificationInsert = TablesInsert<"notifications">;
export type NotificationUpdate = TablesUpdate<"notifications">;

/**
 * Notification Service
 * Handles user notifications
 */
export const notificationService = {
    /**
     * Create a new notification
     */
    async createNotification(notification: NotificationInsert): Promise<Notification | null> {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .insert(notification)
                .select();

            if (error) throw error;

            const result = data && data.length > 0 ? data[0] : null;
            if (result) console.log("✓ Notification created:", result.id);
            return result;
        } catch (error) {
            console.error("Error creating notification:", error);
            return null;
        }
    },

    /**
     * Get all notifications for a user
     */
    async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
    },

    /**
     * Get unread notifications count
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error("Error fetching unread count:", error);
            return 0;
        }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({
                    is_read: true,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", notificationId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error marking notification as read:", error);
            return false;
        }
    },

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({
                    is_read: true,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) throw error;
            console.log("✓ All notifications marked as read for user:", userId);
            return true;
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            return false;
        }
    },

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", notificationId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting notification:", error);
            return false;
        }
    },

    /**
     * Delete all notifications for a user
     */
    async deleteAllNotifications(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("user_id", userId);

            if (error) throw error;
            console.log("✓ All notifications deleted for user:", userId);
            return true;
        } catch (error) {
            console.error("Error deleting all notifications:", error);
            return false;
        }
    },

    /**
     * Send notification to user (helper method with predefined types)
     */
    async sendSuccess(userId: string, title: string, message: string): Promise<Notification | null> {
        return this.createNotification({
            user_id: userId,
            title,
            message,
            type: "success",
        });
    },

    async sendInfo(userId: string, title: string, message: string): Promise<Notification | null> {
        return this.createNotification({
            user_id: userId,
            title,
            message,
            type: "info",
        });
    },

    async sendWarning(userId: string, title: string, message: string): Promise<Notification | null> {
        return this.createNotification({
            user_id: userId,
            title,
            message,
            type: "warning",
        });
    },

    async sendError(userId: string, title: string, message: string): Promise<Notification | null> {
        return this.createNotification({
            user_id: userId,
            title,
            message,
            type: "error",
        });
    },
};
