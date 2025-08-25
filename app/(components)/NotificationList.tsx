'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import * as db from '@/lib/dataStore';

// Types for better code organization and type safety
interface NotificationToast {
  message: string;
  type: 'success' | 'error';
}

function formatRelativeTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.max(0, (now.getTime() - d.getTime()) / 1000); // ensure non-negative
  
  // Handle future dates (shouldn't happen, but just in case)
  if (diff < 0) return 'just now';
  
  // More granular time differences
  if (diff < 30) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`; // within a week
  
  // For older dates, show the actual date
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function truncateText(str: string, n: number) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

// Toast notification system
function useNotificationToast() {
  const [toast, setToast] = useState<NotificationToast | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const Toast = toast ? (
    <div
      className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white 
      transform transition-all duration-300 ease-in-out
      ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      {toast.message}
    </div>
  ) : null;

  return { Toast, showToast };
}

// Notification content renderer
function NotificationContent({ notification, users }: { notification: db.Notification; users: db.User[] }) {
  const actor = users.find(u => u.id === notification.actorId);
  const actorName = actor?.name || 'Someone';

  const content = {
    'new_post': <>{actorName} created a new post{notification.text && <>: <span className="italic">{truncateText(notification.text, 60)}</span></>}</>,
    'new_like': <>{actorName} liked your post{notification.text && <>: <span className="italic">{truncateText(notification.text, 60)}</span></>}</>,
    'new_follow': <>{actorName} started following you</>,
  }[notification.type] || <>{notification.text}</>;

  return (
    <div className="flex flex-col">
      <div className="font-medium text-gray-900 leading-snug">{content}</div>
      <div className="text-xs text-gray-500 mt-1">{formatRelativeTime(notification.createdAt)}</div>
    </div>
  );
}

// Main component
export default function NotificationList() {
  const [notifications, setNotifications] = useState<db.Notification[]>([]);
  const [sort, setSort] = useState<'chrono' | 'ai'>('chrono');
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { selectedUser: userId, users } = useUser();
  const [demoLoading, setDemoLoading] = useState(false);
  const { Toast, showToast } = useNotificationToast();

  const fetchNotifications = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    try {
      // Simulate network delay
      setTimeout(() => {
        const notifs = db.getNotifications(userId, {
          unreadOnly: unreadOnly,
          sort: sort
        });
        setNotifications(notifs);
        setLoading(false);
      }, 1500); // 1.5 second delay
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      showToast('Failed to load notifications. Please try again.', 'error');
      setLoading(false);
    }
  }, [userId, sort, unreadOnly, showToast]);

  // Only fetch when user changes
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
  }, [fetchNotifications, userId]);

  // Handle marking notifications as read
  const markRead = (id: string) => {
    try {
      setTimeout(() => {
        const result = db.markNotificationAsRead(id);
        if (result) {
          setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
          ));
          showToast('Marked as read', 'success');
        } else {
          throw new Error('Failed to mark as read');
        }
      }, 500); // 0.5 second delay for mark as read
    } catch (error) {
      showToast('Failed to mark as read', 'error');
      console.error('Error marking as read:', error);
    }
  };

  // Handle demo event creation
  const triggerDemoEvent = (type: "new_post" | "new_like" | "new_follow") => {
    if (!userId) {
      showToast('Please select a demo user first', 'error');
      return;
    }
    
    setDemoLoading(true);
    
    try {
      // Get all users 
      const allUsers = db.getUsers();
      const currentUser = allUsers.find(u => u.id === userId);
      
      if (!currentUser) {
        showToast('Your user has been removed, please select another', 'error');
        return;
      }

      const others = allUsers.filter(u => u.id !== userId);

      switch (type) {
        case 'new_post': {
          if (others.length === 0) {
            showToast('No other users available. Please reseed.', 'error');
            return;
          }
          const actor = others[Math.floor(Math.random() * others.length)];
          const post = db.createPost({
            authorId: actor.id,
            content: `A new post from ${actor.name}`
          });
          db.createNotification({
            userId,
            type: 'new_post',
            actorId: actor.id,
            text: post.content,
            objectType: 'post',
            objectId: post.id
          });
          break;
        }
        case 'new_like': {
          if (others.length === 0) {
            showToast('No other users available. Please reseed.', 'error');
            return;
          }
          const actor = others[Math.floor(Math.random() * others.length)];
          // First create a post by the current user
          const post = db.createPost({
            authorId: userId,
            content: 'A post to be liked'
          });
          // Then create the like by the other user
          db.createReaction({
            userId: actor.id,
            postId: post.id,
            type: 'like'
          });
          // Create the notification
          db.createNotification({
            userId,
            type: 'new_like',
            actorId: actor.id,
            text: 'Liked your post',
            objectType: 'post',
            objectId: post.id
          });
          break;
        }
        case 'new_follow': {
          if (others.length === 0) {
            showToast('No other users available. Please reseed.', 'error');
            return;
          }
          const actor = others[Math.floor(Math.random() * others.length)];
          // Create the follow
          db.createFollow(actor.id, userId);
          // Create the notification
          db.createNotification({
            userId,
            type: 'new_follow',
            actorId: actor.id,
            text: 'Started following you'
          });
          break;
        }
      }

      setTimeout(() => {
        showToast(`Demo ${type.replace('new_', '')} created`, 'success');
        fetchNotifications();
      }, 1000); // 1 second delay for new notifications
    } catch (error) {
      showToast('Failed to create demo event', 'error');
      console.error('Error creating demo event:', error);
    } finally {
      setDemoLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="text-4xl mb-4">👤</div>
        <p className="font-medium">Welcome to Insyd Notifications!</p>
        <div className="mt-4 space-y-3 text-sm max-w-md mx-auto">
          <p className="p-2 bg-blue-50 rounded-lg">
            👉 Start by selecting a demo user above
          </p>
          <p className="p-2 bg-green-50 rounded-lg">
            📝 Create posts, follow users, and like content
          </p>
          <p className="p-2 bg-purple-50 rounded-lg">
            📧 Check your notification digest to see all activity
          </p>
          <p className="p-2 bg-yellow-50 rounded-lg">
            🔄 Use "Reseed Data" to reset the demo anytime
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls section */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b pb-4 z-10 px-4 py-3 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-full font-medium shadow-sm border transition-all duration-200 
                ${sort === 'chrono' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:scale-102'}`}
              onClick={() => setSort('chrono')}
            >
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">⏱️</span> Chronological
              </span>
            </button>
            <button
              className={`px-4 py-2 rounded-full font-medium shadow-sm border transition-all duration-200 
                ${sort === 'ai' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:scale-102'}`}
              onClick={() => setSort('ai')}
            >
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">🤖</span> AI Ranked
              </span>
            </button>
          </div>
          
          <label className="flex items-center gap-2 ml-0 sm:ml-4">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => setUnreadOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Unread only</span>
          </label>

          <div className="flex gap-2 mt-2 sm:mt-0 ml-auto">
            <button
              className="px-3 py-1.5 rounded bg-green-500 text-white text-sm font-medium shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={demoLoading}
              onClick={() => triggerDemoEvent('new_post')}
            >
              <span className="hidden sm:inline">📝</span> New Post
            </button>
            <button
              className="px-3 py-1.5 rounded bg-blue-500 text-white text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={demoLoading}
              onClick={() => triggerDemoEvent('new_like')}
            >
              <span className="hidden sm:inline">👍</span> Like
            </button>
            <button
              className="px-3 py-1.5 rounded bg-purple-500 text-white text-sm font-medium shadow-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={demoLoading}
              onClick={() => triggerDemoEvent('new_follow')}
            >
              <span className="hidden sm:inline">👥</span> Follow
            </button>
          </div>
        </div>
      </div>

      {/* Content section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <p className="font-medium">No notifications found</p>
          <p className="text-sm mt-2">Try creating some demo interactions!</p>
        </div>
      ) : (
        <ul className="space-y-4 px-4">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`relative rounded-xl shadow-sm border p-4 flex items-center gap-4 
                transition-all duration-200 hover:shadow-md
                ${!n.read 
                  ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              {/* Unread indicator */}
              {!n.read && (
                <span className="absolute left-2 top-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              )}

              {/* Notification icon */}
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${n.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                {n.type === 'new_post' && '📝'}
                {n.type === 'new_like' && '👍'}
                {n.type === 'new_follow' && '👥'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <NotificationContent notification={n} users={users} />
              </div>

              {/* Action buttons */}
              {!n.read && (
                <button
                  className="shrink-0 ml-4 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-full shadow-sm 
                    hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => markRead(n.id)}
                >
                  Mark as Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Toast notifications */}
      {Toast}
    </div>
  );
}
