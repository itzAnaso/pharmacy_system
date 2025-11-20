
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/lib/auth';

export interface Notification {
  id: string;
  type: 'low_stock' | 'expired' | 'payment' | 'sale';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
  data?: any;
}

export const useNotifications = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch low stock and expired products
  const { data: alertData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [lowStockRes, expiredRes] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', user.id).lt('stock_quantity', 10),
        supabase.from('products').select('*').eq('user_id', user.id).lte('expiry_date', new Date().toISOString().split('T')[0])
      ]);

      return {
        lowStock: lowStockRes.data || [],
        expired: expiredRes.data || []
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  useEffect(() => {
    if (!alertData) return;

    const newNotifications: Notification[] = [];

    // Low stock notifications
    alertData.lowStock.forEach(product => {
      newNotifications.push({
        id: `low-stock-${product.id}`,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${product.stock_quantity} left)`,
        priority: product.stock_quantity < 5 ? 'high' : 'medium',
        read: false,
        created_at: new Date().toISOString(),
        data: product
      });
    });

    // Expired product notifications
    alertData.expired.forEach(product => {
      newNotifications.push({
        id: `expired-${product.id}`,
        type: 'expired',
        title: 'Expired Product',
        message: `${product.name} has expired on ${new Date(product.expiry_date).toLocaleDateString()}`,
        priority: 'high',
        read: false,
        created_at: new Date().toISOString(),
        data: product
      });
    });

    setNotifications(newNotifications);
  }, [alertData]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => !n.read && n.priority === 'high').length;

  return {
    notifications,
    unreadCount,
    highPriorityCount,
    markAsRead,
    markAllAsRead
  };
};
