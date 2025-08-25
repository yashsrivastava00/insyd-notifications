"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWithRetry } from '@/lib/fetch-retry';

interface User {
  id: string;
  name: string;
  bio: string;
}

interface UserContextType {
  users: User[];
  selectedUser: string | null;
  setSelectedUser: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  reseedData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(() => getInitialUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry('/api/users', {
        headers: { 'Cache-Control': 'no-cache' },
        retry: { maxRetries: 3, initialDelayMs: 500 }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      
      if (!Array.isArray(data.users)) throw new Error('Invalid user data');
      setUsers(data.users);
      
      // Validate current selection
      if (selectedUser) {
        const userExists = data.users.find((u: User) => u.id === selectedUser);
        if (!userExists) {
          setSelectedUser(null);
          syncToUrlAndStorage(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
      setSelectedUser(null);
      syncToUrlAndStorage(null);
    } finally {
      setLoading(false);
    }
  };

  const reseedData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Clear selection first
      setSelectedUser(null);
      syncToUrlAndStorage(null);
      
      const response = await fetchWithRetry('/api/seed', {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' },
        retry: { maxRetries: 2, initialDelayMs: 1000 }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to seed data');
      }

      // Refresh user list after seeding
      await fetchUsers();
    } catch (err: any) {
      console.error('Error seeding data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const newUserId = getInitialUser();
      if (newUserId !== selectedUser) {
        setSelectedUser(newUserId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedUser]);

  const value = {
    users,
    selectedUser,
    setSelectedUser: (id: string | null) => {
      setSelectedUser(id);
      syncToUrlAndStorage(id);
    },
    loading,
    error,
    fetchUsers,
    reseedData
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function syncToUrlAndStorage(userId: string | null) {
  if (typeof window === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    if (userId) {
      params.set('user', userId);
      localStorage.setItem('insyd_user', userId);
    } else {
      params.delete('user');
      localStorage.removeItem('insyd_user');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  } catch (e) {
    console.error('Error syncing user state:', e);
  }
}

function getInitialUser(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try URL first
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get('user');
    if (urlUser) return urlUser;
    
    // Then localStorage
    return localStorage.getItem('insyd_user');
  } catch (e) {
    console.error('Error reading initial user state:', e);
    return null;
  }
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
