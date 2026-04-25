import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bell, Info, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type NotificationType = 'lead' | 'system' | 'message' | 'success';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (title: string, message: string, type: NotificationType) => {
    const newNotification: AppNotification = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Browser Notification fallback
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
