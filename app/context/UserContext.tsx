"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      if (!Array.isArray(data.users)) throw new Error('Invalid user data');
      setUsers(data.users);
      
      // Validate current selection
      const stored = localStorage.getItem('insyd_user');
      if (stored) {
        const userExists = data.users.find((u: User) => u.id === stored);
        if (userExists) {
          setSelectedUser(stored);
          // Update URL
          const params = new URLSearchParams(window.location.search);
          params.set('user', stored);
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          window.history.replaceState({}, '', newUrl);
        } else {
          localStorage.removeItem('insyd_user');
          setSelectedUser(null);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setSelectedUser(null);
      localStorage.removeItem('insyd_user');
    } finally {
      setLoading(false);
    }
  };

  const reseedData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Clear current selection first
      setSelectedUser(null);
      localStorage.removeItem('insyd_user');
      
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to seed data');
      }

      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      
      // Fetch fresh user list
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const value = {
    users,
    selectedUser,
    setSelectedUser: (id: string | null) => {
      setSelectedUser(id);
      if (id) {
        localStorage.setItem('insyd_user', id);
        const params = new URLSearchParams(window.location.search);
        params.set('user', id);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
      } else {
        localStorage.removeItem('insyd_user');
        window.history.replaceState({}, '', window.location.pathname);
      }
    },
    loading,
    error,
    fetchUsers,
    reseedData
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
