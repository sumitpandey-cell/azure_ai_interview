"use client";

import { useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const handleDelete = (notificationId: string) => {
    removeNotification(notificationId);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/40 hover:bg-accent transition-colors active:scale-95 group relative">
          <Bell className="h-4 w-4 text-foreground group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
          <h3 className="text-xs font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-xs font-medium">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors relative group/item ${!notification.is_read ? 'bg-primary/5' : 'hover:bg-accent/50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-lg shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-foreground mb-1 leading-tight">{notification.title}</h4>
                      <p className="text-[11px] font-medium text-muted-foreground leading-snug line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[9px] font-medium text-muted-foreground/60 mt-2 uppercase">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          className="p-1 rounded-md hover:bg-accent text-primary transition-colors"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu >
  )
}