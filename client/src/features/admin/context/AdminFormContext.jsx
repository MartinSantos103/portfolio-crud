/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../services/api.js';

const AdminFormContext = createContext({
  isDirty: false,
  isFormRoute: false,
  setFormDirtyState: () => {},
  unreadMessagesCount: 0,
  refreshUnreadMessages: () => {},
});

export function AdminFormProvider({ children }) {
  const [isDirty, setIsDirty] = useState(false);
  const [isFormRoute, setIsFormRoute] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const setFormDirtyState = useCallback((dirty, activeForm = true) => {
    setIsDirty(Boolean(dirty));
    setIsFormRoute(Boolean(activeForm));
  }, []);

  const refreshUnreadMessages = useCallback(async () => {
    try {
      const res = await apiFetch('/messages?limit=1');
      if (typeof res?.unreadCount === 'number') {
        setUnreadMessagesCount(res.unreadCount);
      }
    } catch {
      // Silencioso si falla temporalmente
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshUnreadMessages();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshUnreadMessages]);

  return (
    <AdminFormContext.Provider
      value={{
        isDirty,
        isFormRoute,
        setFormDirtyState,
        unreadMessagesCount,
        setUnreadMessagesCount,
        refreshUnreadMessages,
      }}
    >
      {children}
    </AdminFormContext.Provider>
  );
}

export function useAdminFormContext() {
  return useContext(AdminFormContext);
}
