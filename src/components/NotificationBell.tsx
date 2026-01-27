"use client";

import { useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
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
        <Button variant="ghost" size="icon" className="relative h-10 w-10 bg-muted/50 backdrop-blur-xl rounded-full border border-border/50 hover:bg-muted/80 transition-all duration-500 group">
          <Bell className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <div className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75"></span>
              <Badge
                variant="destructive"
                className="relative h-3.5 w-3.5 flex items-center justify-center p-0 text-[8px] font-black border-2 border-background shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card/80 backdrop-blur-3xl border-border/50 rounded-2xl p-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-muted/30">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Neural Alerts</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 px-3 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary rounded-lg"
            >
              <Check className="h-3 w-3 mr-1.5" />
              Clear Protocol
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0 bg-white/5" />

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="p-8 text-center space-y-3">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Scanning Network...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">No Active Signals</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-all duration-300 relative group/item ${!notification.is_read ? 'bg-primary/[0.03]' : 'hover:bg-white/[0.02]'
                    }`}
                >
                  {!notification.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary shadow-[2px_0_8px_rgba(168,85,247,0.4)]" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-7 w-7 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center text-xs shadow-inner shrink-0 leading-none">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[11px] font-black uppercase tracking-tight leading-tight mb-1 ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-[10px] font-medium text-muted-foreground/80 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 opacity-60">
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <p className="text-[9px] font-bold uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-primary/20 hover:text-primary transition-all"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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