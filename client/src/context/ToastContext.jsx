import React, { useState, useCallback, createContext, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { socket } from '../socket'; // Adjust path based on your socket file location

export const ToastContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'default') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  useEffect(() => {
    addToast('System: Real-time service initialized.', 'success');
    socket.on('fileUploaded', (data) => {
      console.log('Socket event received:', data);
      addToast(data.message, 'info');
    });
    return () => { socket.off('fileUploaded'); };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center p-4 rounded-lg shadow-xl text-sm ${toast.type === 'success' ? 'bg-green-600' : (toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600')} text-white`}>
            <Bell className="w-5 h-5 mr-3" />
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-4 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};