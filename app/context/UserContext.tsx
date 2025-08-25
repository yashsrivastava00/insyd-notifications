"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as db from '@/lib/dataStore';
import { seedLocalStorage } from '@/lib/seedLocalStorage';

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
  fetchUsers: () => void;
  reseedData: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(() => getInitialUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        const dbUsers = db.getUsers();
        
        // Remove any duplicate users
        const uniqueUsers = dbUsers.reduce((acc: User[], curr: User) => {
          if (!acc.find(u => u.id === curr.id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setUsers(uniqueUsers);
        
        // Validate current selection
        if (selectedUser) {
          const userExists = uniqueUsers.find((u: User) => u.id === selectedUser);
          if (!userExists) {
            setSelectedUser(null);
            syncToUrlAndStorage(null);
          } else {
            // Re-sync to ensure state is consistent
            syncToUrlAndStorage(selectedUser);
          }
        }
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message);
        setSelectedUser(null);
        syncToUrlAndStorage(null);
        setLoading(false);
      }
    };

    // Simulate network delay
    setTimeout(fetchData, 1500);
  };

  const reseedData = () => {
    setLoading(true);
    setError(null);
    
    // Simulate network delay
    setTimeout(() => {
      try {
        // Clear selection first
        setSelectedUser(null);
        syncToUrlAndStorage(null);
        
        const result = seedLocalStorage();
        console.log('Seeded data:', result);

        // Refresh user list after seeding with additional delay
        setTimeout(fetchUsers, 1000);
      } catch (err: any) {
        console.error('Error seeding data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 2000); // 2 second delay for seeding
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
