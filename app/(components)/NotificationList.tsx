"use client";
import { useEffect, useState, useCallback } from "react";

// Types for better code organization and type safety
interface Notification {
  id: string;
  type: string;
  actorName: string;
  text: string;
  read: boolean;
  createdAt: string;
  objectId?: string;
  objectType?: string;
}

interface NotificationToast {
  message: string;
  type: 'success' | 'error';
}

// Utility: read user id from ?user=<id> query param
function getUserIdFromParams(searchParams: any | null) {
  try {
    return searchParams?.get?.('user') || null;
  } catch (e) {
    return null;
  }
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
function NotificationContent({ n }: { n: Notification }) {
  const content = {
    'new_post': <>{n.actorName} created a new post{n.text && <>: <span className="italic">{truncateText(n.text, 60)}</span></>}</>,
    'new_like': <>{n.actorName} liked your post{n.text && <>: <span className="italic">{truncateText(n.text, 60)}</span></>}</>,
    'new_follow': <>{n.actorName} started following you</>,
  }[n.type] || <>{n.text}</>;

  return (
    <div className="flex flex-col">
      <div className="font-medium text-gray-900 leading-snug">{content}</div>
      <div className="text-xs text-gray-500 mt-1">{formatRelativeTime(n.createdAt)}</div>
    </div>
  );
}

// Main component
export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sort, setSort] = useState<'chrono' | 'ai'>('chrono');
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [userId, setUserId] = useState<string | null>(() => {
    try { const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''); return params.get('user') || null } catch (e) { return null; }
  });
  const [demoLoading, setDemoLoading] = useState(false);
  const { Toast, showToast } = useNotificationToast();

  // Keep userId in sync with URL param by listening for popstate (pushState triggers popstate via UserSelector)
  useEffect(() => {
    const onPop = () => {
      try { const p = new URLSearchParams(window.location.search || ''); setUserId(p.get('user') || null); } catch (e) { /* ignore */ }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Fetch notifications with error handling and cancellation support
  const abortRef = /*#__PURE__*/ { current: null as AbortController | null };

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    // Validate user ID format to avoid unnecessary requests
    if (typeof userId !== 'string' || !userId.trim()) {
      setUserId(null);
      // remove ?user param if invalid (client-side history replace)
      try {
        const params = new URLSearchParams(window.location.search || '');
        params.delete('user');
        const url = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', url);
        window.dispatchEvent(new Event('popstate'));
      } catch (e) {
        // ignore
      }
      return;
    }

    // Cancel any in-flight request before starting a new one
    try {
      abortRef.current?.abort();
    } catch (e) {
      // ignore
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      // First validate that the user still exists
      const validateResponse = await fetch(`/api/users`, { signal: controller.signal });
      const userData = await validateResponse.json();
      
      if (!Array.isArray(userData.users) || !userData.users.find((u: any) => u.id === userId)) {
        // clear ?user param
        try {
          const params = new URLSearchParams(window.location.search || '');
          params.delete('user');
          const url = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
          window.history.replaceState({}, '', url);
          window.dispatchEvent(new Event('popstate'));
        } catch (e) {
          // ignore
        }
        setUserId(null);
        showToast('Selected user not found. Please select a demo user.', 'error');
        return;
      }

      // Then fetch notifications
      const response = await fetch(
        `/api/users/${userId}/notifications?sort=${sort}&unreadOnly=${unreadOnly}&limit=50`,
        { signal: controller.signal }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      // Double check userMissing flag
      if (data.meta?.userMissing) {
        // clear ?user param
        try {
          const params = new URLSearchParams(window.location.search || '');
          params.delete('user');
          const url = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
          window.history.replaceState({}, '', url);
          window.dispatchEvent(new Event('popstate'));
        } catch (e) {
          // ignore
        }
        setUserId(null);
        showToast('Selected user not found. Please select a demo user.', 'error');
        return;
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (error: any) {
      if (error && error.name === 'AbortError') {
        // Request was aborted; don't show an error toast in this case
        return;
      }
      console.error('Error fetching notifications:', error);
      
      // Clear invalid user state
      if (error.message?.includes('not found') || error.message?.includes('invalid')) {
        try {
          const params = new URLSearchParams(window.location.search || '');
          params.delete('user');
          const url = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
          window.history.replaceState({}, '', url);
          window.dispatchEvent(new Event('popstate'));
        } catch (e) {}
        setUserId(null);
        showToast('Selected user is invalid. Please select a demo user.', 'error');
      } else {
        showToast('Failed to load notifications. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, sort, unreadOnly, showToast]);

  // Set up polling for real-time updates using a single timeout loop and cancellation.
  useEffect(() => {
    let stopped = false;
    let timer: number | null = null;

    const loop = async () => {
      // Only fetch when we have a userId
      if (!userId) return;
      await fetchNotifications();
      if (stopped) return;
      // Schedule next poll
      timer = window.setTimeout(loop, 15000);
    };

    // Start immediately if we have a userId
    if (userId) loop();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      try {
        abortRef.current?.abort();
      } catch (e) {
        // ignore
      }
    };
  }, [fetchNotifications, userId]);

  // Handle marking notifications as read
  const markRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (!response.ok) throw new Error('Failed to mark as read');
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      showToast('Marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark as read', 'error');
      console.error('Error marking as read:', error);
    }
  };

  // Handle demo event creation
  const triggerDemoEvent = async (type: "new_post" | "new_like" | "new_follow") => {
    if (!userId) return;
    setDemoLoading(true);
    try {
      // Actor should be the currently selected demo user (no random actor)
      if (!userId) {
        showToast('Please select a demo user first', 'error');
        setDemoLoading(false);
        return;
      }

      // Fetch other users only when we need a target (for like/follow targeting)
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      const allUsers = Array.isArray(usersData.users) ? usersData.users : [];
      const others = allUsers.filter((u: any) => u.id !== userId);

  // actor will be a random other user; notifyUserId is the selected user so they receive the notification
  let event: any = { type, actorId: undefined, notifyUserId: userId };

      switch (type) {
        case 'new_post':
          // actor will be a random other user (simulate someone else posting about/for you)
          if (others.length === 0) {
            showToast('No other users available. Please reseed or select another user.', 'error');
            setDemoLoading(false);
            return;
          }
          const actorForPost = others[Math.floor(Math.random() * others.length)];
          event = { ...event, actorId: actorForPost?.id, objectType: 'post', objectId: '', text: `A new post from ${actorForPost?.name || 'someone'}` };
          break;
        case 'new_like':
          if (others.length === 0) {
            showToast('No other users to like a post from', 'error');
            setDemoLoading(false);
            return;
          }
          // selected user likes a post by a random other user
          const actorForLike = others[Math.floor(Math.random() * others.length)];
          // actor likes a post by target (notify selected user)
          event = { ...event, actorId: actorForLike.id, type: 'new_like', objectType: 'post', targetUserId: userId, text: `Liked a post by you` };
          // Ensure there is at least one post to like; if not, create a lightweight post by the target
          try {
            const check = await fetch('/api/users'); // rely on users endpoint for simplicity
            // We won't block the UI on creating a post here; server will return an error if none found
          } catch (e) {
            // ignore network errors here
          }
          break;
        case 'new_follow':
          if (others.length === 0) {
            showToast('No other users to follow', 'error');
            setDemoLoading(false);
            return;
          }
          // selected user follows a random other user
          const actorForFollow = others[Math.floor(Math.random() * others.length)];
          // actorForFollow will follow the selected user (notify selected user)
          event = { ...event, actorId: actorForFollow.id, objectType: 'user', followeeId: userId, text: `Started following you` };
          break;
      }

      // Make sure actorId is set correctly; fall back to the selected user if something went wrong
      if (!event.actorId) event.actorId = userId;
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        // Read server body for a helpful error
        let body = null;
        try { body = await response.json(); } catch (e) { /* ignore */ }

        // If server indicates no post exists for a 'like', create a lightweight post first and retry once
        if (type === 'new_like' && body && typeof body.error === 'string' && body.error.toLowerCase().includes('no post available')) {
          // create a lightweight post by the target (notifyUserId)
          try {
            const createPostRes = await fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'new_post', actorId: event.actorId, notifyUserId: event.notifyUserId, text: 'Auto post for demo like' })
            });
            if (createPostRes.ok) {
              // retry the like once
              const retryRes = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
              if (retryRes.ok) {
                showToast(`Demo ${type.replace('new_', '')} created`, 'success');
                setTimeout(() => void fetchNotifications(), 600);
                return;
              }
            }
          } catch (e) {
            // ignore and fall through to generic error
          }
        }

        // If the event failed due to foreign key constraints (stale IDs after reseed), refresh users and clear invalid selection
        if (response.status === 400 && body && typeof body.error === 'string') {
          const err = body.error;
          if (err.toLowerCase().includes('foreign key') || err.toLowerCase().includes('actorid') || err.toLowerCase().includes('followeeid')) {
            try {
              const ures = await fetch('/api/users');
              const udata = await ures.json();
              const has = Array.isArray(udata.users) && udata.users.find((u: any) => u.id === userId);
              if (!has) {
                try { localStorage.removeItem('insyd_user'); } catch (e) {}
                setUserId(null);
                showToast('Selected user is no longer valid after reseed. Please select a demo user.', 'error');
                return;
              }
            } catch (e) {
              // ignore
            }
          }
        }
        throw new Error('Failed to create demo event');
      }
      showToast(`Demo ${type.replace('new_', '')} created`, 'success');
      
  // Wait briefly then fetch new notifications (await to avoid overlapping requests)
  setTimeout(() => void fetchNotifications(), 600);
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
        <p className="font-medium">Please select a user above</p>
        <p className="text-sm mt-2">to view and interact with notifications</p>
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
                <NotificationContent n={n} />
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
