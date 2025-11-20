
import React from 'react';
import { Bell, AlertTriangle, Package, Clock, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'low_stock':
      return <Package className="h-4 w-4 text-orange-500" />;
    case 'expired':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-blue-500" />;
  }
};

const NotificationItem = ({ notification, onMarkAsRead }: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void; 
}) => {
  const priorityColors = {
    low: 'border-l-blue-500',
    medium: 'border-l-orange-500',
    high: 'border-l-red-500'
  };

  return (
    <div 
      className={cn(
        'p-4 border-l-4 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md',
        priorityColors[notification.priority],
        !notification.read && 'bg-blue-50'
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {new Date(notification.created_at).toLocaleTimeString()}
            </span>
            <Badge 
              variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {notification.priority}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationPanel = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-blue-50 transition-colors rounded-xl"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-96 bg-gray-50">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-gray-900">
            <Bell className="h-5 w-5 text-blue-500" />
            Notifications
          </SheetTitle>
          <SheetDescription className="flex items-center justify-between">
            <span>{unreadCount} unread notifications</span>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs hover:bg-blue-100"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-full pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
