import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { onGlobalError } from '../lib/apiError';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

let notificationSeq = 0;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = ++notificationSeq;
    setNotifications((prev) =>
      // Evita repetir el mismo mensaje mientras sigue visible (ej. varias peticiones fallan a la vez)
      prev.some((n) => n.message === message && n.type === type) ? prev : [...prev, { id, message, type }]
    );
    // Los errores se leen con más calma
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, type === 'error' ? 7000 : 4000);
  }, []);

  // Errores de la API que ningún componente manejó (ver lib/apiError.ts)
  useEffect(() => onGlobalError((message) => showNotification(message, 'error')), [showNotification]);

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-100 animate-in slide-in-from-right-10 duration-300 min-w-[320px]"
          >
            <div className={`p-2 rounded-xl ${
              n.type === 'success' ? 'bg-green-50 text-green-500' :
              n.type === 'error' ? 'bg-red-50 text-red-500' :
              n.type === 'warning' ? 'bg-orange-50 text-orange-500' :
              'bg-blue-50 text-blue-500'
            }`}>
              {n.type === 'success' && <CheckCircle size={20} />}
              {n.type === 'error' && <AlertCircle size={20} />}
              {n.type === 'warning' && <AlertCircle size={20} />}
              {n.type === 'info' && <Info size={20} />}
            </div>
            <p className="flex-1 max-w-[420px] text-sm font-bold text-slate-700 whitespace-pre-line">{n.message}</p>
            <button onClick={() => removeNotification(n.id)} className="text-slate-300 hover:text-slate-500">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
